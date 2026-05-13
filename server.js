'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_TURN_TTL = process.env.TWILIO_TURN_TTL || '3600';

function getIceServers() {
  const raw = process.env.WEBRTC_ICE_SERVERS_JSON;
  if (!raw) return DEFAULT_ICE_SERVERS;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('[config] WEBRTC_ICE_SERVERS_JSON is not a non-empty array, using default STUN.');
      return DEFAULT_ICE_SERVERS;
    }

    const valid = parsed.every((item) => item && (typeof item.urls === 'string' || Array.isArray(item.urls)));
    if (!valid) {
      console.warn('[config] WEBRTC_ICE_SERVERS_JSON has invalid entries, using default STUN.');
      return DEFAULT_ICE_SERVERS;
    }

    return parsed;
  } catch (err) {
    console.warn(`[config] Failed to parse WEBRTC_ICE_SERVERS_JSON: ${err.message}. Using default STUN.`);
    return DEFAULT_ICE_SERVERS;
  }
}

const ICE_SERVERS = getIceServers();

function normalizeIceServers(servers) {
  if (!Array.isArray(servers) || servers.length === 0) return DEFAULT_ICE_SERVERS;
  return servers.map((s) => {
    const out = { ...s };
    if (!out.urls && out.url) {
      out.urls = out.url;
      delete out.url;
    }
    return out;
  });
}

async function getTwilioIceServers() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Tokens.json`;
  const body = new URLSearchParams({ Ttl: String(TWILIO_TURN_TTL) }).toString();

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!resp.ok) {
    throw new Error(`Twilio token request failed with status ${resp.status}`);
  }

  const data = await resp.json();
  return normalizeIceServers(data.ice_servers);
}

// ── MIME types for static file serving ──────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.ico':  'image/x-icon',
};

// ── In-memory session store ──────────────────────────────────────────────────
// sessions: Map<code, { peers: WebSocket[], timer: NodeJS.Timeout | null }>
const sessions = new Map();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

function generateCode() {
  let code;
  do {
    code = Array.from({ length: CODE_LENGTH }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (sessions.has(code));
  return code;
}

function startExpiryTimer(code) {
  const session = sessions.get(code);
  if (!session) return;
  if (session.timer) clearTimeout(session.timer);
  session.timer = setTimeout(() => {
    sessions.delete(code);
    console.log(`[session] expired: ${code}`);
  }, SESSION_TTL_MS);
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

// ── HTTP server (static files) ───────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/webrtc-config') {
    (async () => {
      let servers = ICE_SERVERS;
      try {
        const twilioServers = await getTwilioIceServers();
        if (twilioServers && twilioServers.length > 0) {
          servers = twilioServers;
        }
      } catch (err) {
        console.warn(`[config] Failed to fetch Twilio ICE servers: ${err.message}. Using fallback config.`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ iceServers: servers }));
    })();
    return;
  }

  let urlPath = req.url === '/' ? '/index.html' : req.url;
  // Strip query strings
  urlPath = urlPath.split('?')[0];
  // Alias for the placeholder login page
  if (urlPath === '/login') urlPath = '/login.html';
  const filePath = path.join(PUBLIC_DIR, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end(); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// ── WebSocket signaling server ───────────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws._sessionCode = null; // assigned after a valid join

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch {
      send(ws, { type: 'error', message: 'Invalid JSON.' });
      return;
    }

    const { type } = msg;

    // ── join ────────────────────────────────────────────────────────────────
    if (type === 'join') {
      const { code } = msg;

      // "start" means the client wants a brand-new session
      if (code === 'start') {
        const newCode = generateCode();
        sessions.set(newCode, { peers: [ws], timer: null });
        startExpiryTimer(newCode);
        ws._sessionCode = newCode;
        ws._role = 'offerer';
        send(ws, { type: 'session-created', code: newCode });
        console.log(`[session] created: ${newCode}`);
        return;
      }

      // joining an existing session
      const normalised = code.toUpperCase().trim();
      const session = sessions.get(normalised);

      if (!session) {
        send(ws, { type: 'error', message: 'Session not found. Check the code and try again.' });
        return;
      }

      if (session.peers.length >= 2) {
        send(ws, { type: 'error', message: 'This session is already in progress.' });
        return;
      }

      session.peers.push(ws);
      ws._sessionCode = normalised;
      ws._role = 'answerer';

      // Cancel expiry timer — both peers are now connected
      if (session.timer) { clearTimeout(session.timer); session.timer = null; }

      send(ws, { type: 'joined', code: normalised });

      // Notify the offerer that the peer has joined
      const offerer = session.peers[0];
      send(offerer, { type: 'peer-joined' });
      console.log(`[session] peer joined: ${normalised}`);
      return;
    }

    // ── relay messages (offer / answer / ice-candidate) ──────────────────────
    if (['offer', 'answer', 'ice-candidate'].includes(type)) {
      const code = ws._sessionCode;
      const session = code ? sessions.get(code) : null;
      if (!session) {
        send(ws, { type: 'error', message: 'Not in a session.' });
        return;
      }
      const other = session.peers.find((p) => p !== ws);
      if (other) send(other, msg);
      return;
    }

    send(ws, { type: 'error', message: `Unknown message type: ${type}` });
  });

  ws.on('close', () => {
    const code = ws._sessionCode;
    if (!code) return;
    const session = sessions.get(code);
    if (!session) return;

    session.peers = session.peers.filter((p) => p !== ws);
    console.log(`[session] peer left: ${code} (${session.peers.length} remaining)`);

    if (session.peers.length === 0) {
      // Last peer gone — start expiry countdown
      startExpiryTimer(code);
    } else {
      // Notify remaining peer
      session.peers.forEach((p) => send(p, { type: 'peer-left' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebRTC signaling server running on port ${PORT} (listening on all interfaces)`);
});
