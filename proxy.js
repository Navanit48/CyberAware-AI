/**
 * CyberAware AI — proxy.js
 * Lightweight local proxy server that forwards requests to Google Gemini API.
 *
 * WHY THIS EXISTS
 * ───────────────
 * While Gemini sometimes supports direct browser calls, keeping the proxy
 * hides the API key from the frontend and avoids any potential CORS issues.
 *
 * GEMINI AUTH
 * ───────────
 *   Browser → POST /api/ibm (this proxy, same origin)
 *           → proxy adds "x-goog-api-key: <GEMINI_API_KEY>" header
 *           → proxy forwards POST to Google Gemini API
 *           → response returned to browser
 *
 * USAGE
 * ─────
 *   node proxy.js
 *
 * Then open http://localhost:3000 in your browser.
 * The app and proxy both serve from the same port.
 *
 * REQUIRES: Node.js (no npm install needed — uses only built-in modules)
 */

'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT   = 3000;
const STATIC = path.join(__dirname);   // serves index.html, style.css, script.js, config.js

/* ── MIME types for static file serving ─────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.ico' : 'image/x-icon',
  '.png' : 'image/png',
};

/* ── CORS headers added to every response ────────────────────────────── */
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');
}

/* ── Forward a POST request to an upstream HTTPS URL ─────────────────── */
/* Follows up to 3 redirects automatically.                               */
function proxyPost(targetUrl, reqBody, apiKey, res, redirectsLeft = 3) {
  const parsed  = url.parse(targetUrl);
  const options = {
    hostname: parsed.hostname,
    path    : parsed.path,
    method  : 'POST',
    headers : {
      'Content-Type'  : 'application/json',
      'Content-Length': Buffer.byteLength(reqBody),
      'x-goog-api-key': apiKey,  // Gemini API key header
    },
  };

  const upstream = https.request(options, upstreamRes => {
    // Follow redirects
    if ([301, 302, 307, 308].includes(upstreamRes.statusCode) && redirectsLeft > 0) {
      const location = upstreamRes.headers['location'];
      if (location) {
        upstreamRes.resume();
        const nextUrl = location.startsWith('http')
          ? location
          : `https://${parsed.hostname}${location}`;
        console.log(`  ↪ Redirect ${upstreamRes.statusCode} → ${nextUrl}`);
        return proxyPost(nextUrl, reqBody, apiKey, res, redirectsLeft - 1);
      }
    }

    let body = '';
    upstreamRes.on('data', chunk => { body += chunk; });
    upstreamRes.on('end', () => {
      setCORSHeaders(res);
      res.writeHead(upstreamRes.statusCode, { 'Content-Type': 'application/json' });
      res.end(body);
    });
  });

  upstream.on('error', err => {
    setCORSHeaders(res);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Upstream error: ${err.message}` }));
  });

  upstream.write(reqBody);
  upstream.end();
}

/* ── Serve a static file ─────────────────────────────────────────────── */
function serveStatic(reqPath, res) {
  const safePath = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(STATIC, safePath);

  // Prevent directory traversal
  if (!filePath.startsWith(STATIC)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + safePath);
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

/* ── Main server ─────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  /* Pre-flight CORS — browsers send this before POST */
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  /* ── /api/ibm  — proxy endpoint (kept same route for simplicity) ──── */
  if (req.method === 'POST' && parsed.pathname === '/api/ibm') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); }
      catch {
        setCORSHeaders(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      const { apiKey, targetUrl, requestBody } = payload;

      if (!apiKey || !targetUrl || !requestBody) {
        setCORSHeaders(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing apiKey, targetUrl, or requestBody' }));
        return;
      }

      console.log(`  → Forwarding to Gemini API: ${targetUrl}`);
      proxyPost(targetUrl, JSON.stringify(requestBody), apiKey, res);
    });
    return;
  }

  /* ── Everything else — serve static files ────────────────────────── */
  serveStatic(parsed.pathname, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   CyberAware AI — Gemini API Proxy Server    ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Open: http://localhost:${PORT}                 ║`);
  console.log('  ║   Stop: Ctrl+C                               ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  ℹ  Forwarding requests to Google Gemini API');
  console.log('');
});
