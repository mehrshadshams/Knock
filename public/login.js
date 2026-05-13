'use strict';

// ── Placeholder login page behavior ──────────────────────────────────────────
// This page has no real authentication. It generates a fresh ephemeral
// base32 secret on each visit, builds an otpauth:// URI, and renders it as
// a QR code for future MFA enrollment work. Nothing is sent to the server.

(function () {
  var BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  function generateBase32Secret(length) {
    var bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    var out = '';
    for (var i = 0; i < length; i++) {
      out += BASE32_ALPHABET[bytes[i] % 32];
    }
    return out;
  }

  function buildOtpauthUri(secret) {
    var issuer = 'Knock';
    var account = 'demo@knock';
    var label = encodeURIComponent(issuer + ':' + account);
    var params = [
      'secret=' + secret,
      'issuer=' + encodeURIComponent(issuer),
      'algorithm=SHA1',
      'digits=6',
      'period=30',
    ].join('&');
    return 'otpauth://totp/' + label + '?' + params;
  }

  function renderQr() {
    var canvas = document.getElementById('mfa-qr');
    if (!canvas || !window.QR || typeof window.QR.renderToCanvas !== 'function') return;

    var secret = generateBase32Secret(32);
    var uri = buildOtpauthUri(secret);

    try {
      window.QR.renderToCanvas(canvas, uri, 220, { ecc: 'M', margin: 4 });
    } catch (err) {
      console.warn('Failed to render MFA QR code:', err);
    }
  }

  function navigateHome(event) {
    if (event) event.preventDefault();
    window.location.href = '/';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderQr();

    var form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', navigateHome);

    var btn = document.getElementById('continue-btn');
    if (btn) btn.addEventListener('click', function (e) {
      // Form submit handler covers this when type=submit, but guard for
      // browsers that bypass submit when the form has no inputs filled.
      if (form && form.requestSubmit) return; // submit handler will fire
      navigateHome(e);
    });
  });
})();
