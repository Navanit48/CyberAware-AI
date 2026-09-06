/**
 * CyberAware AI — proxy.js
 * Lightweight local proxy server that forwards requests to the IBM API.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Browsers block direct fetch() calls to IBM watsonx/Bob endpoints due to
 * CORS (Cross-Origin Resource Sharing). IBM's API servers do not include the
 * headers that allow browser-to-API calls. This proxy runs on your machine,
 * receives requests from the browser, adds the IBM auth header, forwards them
 * to IBM, and returns the response — bypassing the CORS restriction entirely.
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

const PORT     = 3000;
const STATIC   = path.join(__dirname);   // serves index.html, style.css, script.js, config.js

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/* ── Forward a POST request to an upstream HTTPS URL ─────────────────── */
/* Follows up to 3 redirects automatically (handles 301/302 from IBM).   */
function proxyPost(targetUrl, reqBody, authHeader, res, redirectsLeft = 3) {
  const parsed  = url.parse(targetUrl);
  const options = {
    hostname: parsed.hostname,
    path    : parsed.path,
    method  : 'POST',
    headers : {
      'Content-Type'  : 'application/json',
      'Content-Length': Buffer.byteLength(reqBody),
      'Authorization' : authHeader,
    },
  };

  const upstream = https.request(options, upstreamRes => {
    // Follow redirects
    if ([301, 302, 307, 308].includes(upstreamRes.statusCode) && redirectsLeft > 0) {
      const location = upstreamRes.headers['location'];
      if (location) {
        // Drain the redirect response body
        upstreamRes.resume();
        const nextUrl = location.startsWith('http')
          ? location
          : `https://${parsed.hostname}${location}`;
        console.log(`  ↪ Redirect ${upstreamRes.statusCode} → ${nextUrl}`);
        return proxyPost(nextUrl, reqBody, authHeader, res, redirectsLeft - 1);
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

  /* ── /api/ibm  — proxy endpoint ──────────────────────────────────── */
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

      const { targetUrl, authHeader, requestBody } = payload;

      if (!targetUrl || !authHeader || !requestBody) {
        setCORSHeaders(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing targetUrl, authHeader, or requestBody' }));
        return;
      }

      proxyPost(targetUrl, JSON.stringify(requestBody), authHeader, res);
    });
    return;
  }

  /* ── Everything else — serve static files ────────────────────────── */
  serveStatic(parsed.pathname, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   CyberAware AI — Proxy + Static Server      ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Open: http://localhost:${PORT}                 ║`);
  console.log('  ║   Stop: Ctrl+C                               ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
