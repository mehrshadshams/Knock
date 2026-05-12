'use strict';

// ── Version badge initialization ──────────────────────────────────────────────
(function initVersionBadge() {
  try {
    // Read version from meta tag
    const versionMeta = document.querySelector('meta[name="app-version"]');
    const versionContent = versionMeta ? versionMeta.getAttribute('content') : '';
    
    // Extract version and hash from meta tag (format: "version:hash")
    let version = '1.0.0';
    let hash = 'dev';
    
    if (versionContent && versionContent !== 'APP_VERSION_HASH') {
      const parts = versionContent.split(':');
      if (parts.length === 2) {
        version = parts[0].trim();
        hash = parts[1].trim();
      } else if (parts.length === 1) {
        version = parts[0].trim();
      }
    } else {
      // Fallback: try to read BUILD_HASH from window or use default
      hash = (typeof window !== 'undefined' && window.__BUILD_HASH__) || 'dev';
    }
    
    // Create and inject badge element
    const badge = document.createElement('div');
    badge.id = 'version-badge';
    badge.textContent = `${version}:${hash}`;
    document.body.insertBefore(badge, document.body.firstChild);
  } catch (err) {
    console.warn('Failed to initialize version badge:', err);
  }
})();

// ── DOM refs ─────────────────────────────────────────────────────────────────
const homeScreen   = document.getElementById('home-screen');
const callScreen   = document.getElementById('call-screen');
const startBtn     = document.getElementById('start-btn');
const codeDisplay  = document.getElementById('code-display');
const sessionCode  = document.getElementById('session-code');
const copyBtn      = document.getElementById('copy-btn');
const copyConfirm  = document.getElementById('copy-confirm');
const codeInput    = document.getElementById('code-input');
const joinBtn      = document.getElementById('join-btn');
const homeError    = document.getElementById('home-error');
const localVideo   = document.getElementById('local-video');
const remoteVideo  = document.getElementById('remote-video');
const muteBtn      = document.getElementById('mute-btn');
const cameraBtn    = document.getElementById('camera-btn');
const hangupBtn    = document.getElementById('hangup-btn');
const callStatus   = document.getElementById('call-status');

// ── State ─────────────────────────────────────────────────────────────────────
let ws          = null;
let pc          = null;       // RTCPeerConnection
let localStream = null;
let isOfferer   = false;
let isMuted     = false;
let isCameraOff = false;

let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
let configLoaded = false;

async function ensureRtcConfigLoaded() {
  if (configLoaded) return;

  try {
    const resp = await fetch('/webrtc-config', { cache: 'no-store' });
    if (!resp.ok) {
      configLoaded = true;
      return;
    }

    const payload = await resp.json();
    if (Array.isArray(payload.iceServers) && payload.iceServers.length > 0) {
      iceServers = payload.iceServers;
    }
  } catch {
    // Keep default STUN on failure.
  }

  configLoaded = true;
}

// ── WebSocket helpers ─────────────────────────────────────────────────────────
function connectWS() {
  // Browsers require secure WebSockets from HTTPS pages.
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.host}`);

  ws.addEventListener('message', (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }
    handleSignal(msg);
  });

  ws.addEventListener('close', () => {
    if (callScreen.classList.contains('hidden')) return; // already on home
    showCallStatus('Connection lost.');
  });
}

function wsSend(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

// ── Error display ─────────────────────────────────────────────────────────────
function showHomeError(msg) {
  homeError.textContent = msg;
  homeError.classList.remove('hidden');
}
function clearHomeError() { homeError.classList.add('hidden'); homeError.textContent = ''; }
function showCallStatus(msg) { callStatus.textContent = msg; }

// ── Screen transitions ────────────────────────────────────────────────────────
function goToCall() {
  homeScreen.classList.add('hidden');
  callScreen.classList.remove('hidden');
}

function goToHome() {
  callScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
  // Reset home UI
  codeDisplay.classList.add('hidden');
  clearHomeError();
  codeInput.value = '';
  startBtn.disabled = false;
  joinBtn.disabled  = false;
}

// ── Media access ──────────────────────────────────────────────────────────────
async function getLocalMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    return true;
  } catch {
    return false;
  }
}

// ── RTCPeerConnection setup ───────────────────────────────────────────────────
function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers });

  // Add local tracks
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // ICE candidates → server
  pc.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) wsSend({ type: 'ice-candidate', candidate });
  });

  // Remote stream → video element
  pc.addEventListener('track', ({ streams }) => {
    if (streams[0]) remoteVideo.srcObject = streams[0];
  });

  pc.addEventListener('connectionstatechange', () => {
    const s = pc.connectionState;
    if (s === 'connected')     showCallStatus('');
    if (s === 'disconnected')  showCallStatus('Reconnecting…');
    if (s === 'failed')        showCallStatus('Connection failed.');
  });
}

// ── Offerer flow ──────────────────────────────────────────────────────────────
async function startOffer() {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  wsSend({ type: 'offer', sdp: pc.localDescription });
}

// ── Signaling message handler ─────────────────────────────────────────────────
async function handleSignal(msg) {
  switch (msg.type) {

    // Server confirms a new session was created (offerer path)
    case 'session-created':
      sessionCode.textContent = msg.code;
      codeDisplay.classList.remove('hidden');
      startBtn.disabled = true;
      break;

    // Answerer successfully joined
    case 'joined':
      goToCall();
      showCallStatus('Connecting…');
      break;

    // Offerer: second peer has joined → start the call
    case 'peer-joined':
      goToCall();
      showCallStatus('Connecting…');
      createPeerConnection();
      await startOffer();
      break;

    // Answerer: received offer → create answer
    case 'offer':
      createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsSend({ type: 'answer', sdp: pc.localDescription });
      break;

    // Offerer: received answer
    case 'answer':
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      break;

    // ICE candidate from remote peer
    case 'ice-candidate':
      if (pc && msg.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
      }
      break;

    // Remote peer disconnected
    case 'peer-left':
      showCallStatus('The other person has left the call.');
      setTimeout(() => { cleanup(); goToHome(); }, 3000);
      break;

    // Server error
    case 'error':
      if (!callScreen.classList.contains('hidden')) {
        showCallStatus(msg.message);
      } else {
        showHomeError(msg.message);
        startBtn.disabled = false;
        joinBtn.disabled  = false;
      }
      break;
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function cleanup() {
  if (pc) { pc.close(); pc = null; }
  if (localStream) { localStream.getTracks().forEach((t) => t.stop()); localStream = null; }
  localVideo.srcObject  = null;
  remoteVideo.srcObject = null;
  if (ws && ws.readyState === WebSocket.OPEN) { ws.close(); ws = null; }
  isMuted     = false;
  isCameraOff = false;
  muteBtn.textContent   = '🎙️';
  cameraBtn.textContent = '📷';
}

// ── "Start a Call" button ─────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  clearHomeError();
  startBtn.disabled = true;

  await ensureRtcConfigLoaded();

  const ok = await getLocalMedia();
  if (!ok) {
    showHomeError('Camera and microphone access are required to make a call.');
    startBtn.disabled = false;
    return;
  }

  connectWS();
  isOfferer = true;

  ws.addEventListener('open', () => {
    wsSend({ type: 'join', code: 'start' });
  });
});

// ── Copy code button ──────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(sessionCode.textContent);
    copyConfirm.classList.remove('hidden');
    setTimeout(() => copyConfirm.classList.add('hidden'), 2000);
  } catch {
    // Fallback for older browsers
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(sessionCode);
    sel.removeAllRanges();
    sel.addRange(range);
  }
});

// ── "Join" button ─────────────────────────────────────────────────────────────
joinBtn.addEventListener('click', async () => {
  clearHomeError();
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 6) {
    showHomeError('Please enter a 6-character session code.');
    return;
  }

  joinBtn.disabled = true;
  startBtn.disabled = true;

  await ensureRtcConfigLoaded();

  const ok = await getLocalMedia();
  if (!ok) {
    showHomeError('Camera and microphone access are required to make a call.');
    joinBtn.disabled  = false;
    startBtn.disabled = false;
    return;
  }

  connectWS();
  isOfferer = false;

  ws.addEventListener('open', () => {
    wsSend({ type: 'join', code });
  });
});

// Also allow pressing Enter in the code input
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});

// Force uppercase as user types
codeInput.addEventListener('input', () => {
  const start = codeInput.selectionStart;
  codeInput.value = codeInput.value.toUpperCase();
  codeInput.setSelectionRange(start, start);
});

// ── Call controls ─────────────────────────────────────────────────────────────
muteBtn.addEventListener('click', () => {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
  muteBtn.textContent = isMuted ? '🔇' : '🎙️';
  muteBtn.classList.toggle('active', isMuted);
});

cameraBtn.addEventListener('click', () => {
  if (!localStream) return;
  isCameraOff = !isCameraOff;
  localStream.getVideoTracks().forEach((t) => { t.enabled = !isCameraOff; });
  cameraBtn.textContent = isCameraOff ? '🚫' : '📷';
  cameraBtn.classList.toggle('active', isCameraOff);
});

hangupBtn.addEventListener('click', () => {
  cleanup();
  goToHome();
});
