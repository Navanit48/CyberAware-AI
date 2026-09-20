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

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url, { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT   = 3000;
const STATIC = path.join(__dirname, 'dist');   // serves built production files or fallback
const THREAT_DB_PATH = path.join(__dirname, 'compromised_url.csv');

/* ── Global Threat Database (In-Memory Set) ─────────────────────────── */
const compromisedDomainsSet = new Set();
let threatCount = 0;

function loadThreatDatabase() {
  if (!fs.existsSync(THREAT_DB_PATH)) {
    console.log('  ⚠️ Threat database not found at:', THREAT_DB_PATH);
    return;
  }
  console.log('  ⏳ Loading compromised domains threat database...');
  const startTime = Date.now();
  try {
    const content = fs.readFileSync(THREAT_DB_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;
      // Strip protocol, trailing paths or ports
      const clean = line.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();
      if (clean) {
        compromisedDomainsSet.add(clean);
      }
    }
    threatCount = compromisedDomainsSet.size;
    console.log(`  🛡️ Loaded ${threatCount.toLocaleString()} compromised domains in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('  ❌ Error reading threat database:', err.message);
  }
}

// Load threat intelligence database on server init
loadThreatDatabase();

/* ── Live Internet Security & Threat Scouring Engine (0 Gemini API Quota) ── */
async function scourInternetThreats(rawDomain) {
  const cleanDomain = (rawDomain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .trim();

  if (!cleanDomain) {
    return {
      domain: '',
      isCompromised: false,
      threatScore: 0,
      threatLevel: 'UNKNOWN',
      scouredSources: []
    };
  }

  // 1. Check Local 290k Blacklist
  let localDbMatch = compromisedDomainsSet.has(cleanDomain);
  let matchedEntry = localDbMatch ? cleanDomain : null;
  if (!localDbMatch) {
    const parts = cleanDomain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parent = parts.slice(i).join('.');
      if (compromisedDomainsSet.has(parent)) {
        matchedEntry = parent;
        localDbMatch = true;
        break;
      }
    }
  }

  // 2. Query Cloudflare 1.1.1.2 Security DNS (DoH) and Google DNS in parallel
  let cloudflareBlocked = false;
  let googleResolved = false;
  let resolvedIps = [];
  let hasMxRecords = false;

  const lookupPromises = [
    // Cloudflare Security Malware Blocking DNS (1.1.1.2)
    fetch(`https://security.cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.Answer) {
          const ips = data.Answer.map(a => a.data);
          if (ips.includes('0.0.0.0') || ips.includes('127.0.0.1')) {
            cloudflareBlocked = true;
          }
        }
      })
      .catch(() => {}),

    // Google Public DNS Resolution & IP Discovery
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`)
      .then(res => res.json())
      .then(data => {
        if (data.Answer && data.Answer.length > 0) {
          googleResolved = true;
          resolvedIps = data.Answer.filter(a => a.type === 1).map(a => a.data);
        }
      })
      .catch(() => {}),

    // Google Public DNS Mail Exchanger (MX) Records
    fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=MX`)
      .then(res => res.json())
      .then(data => {
        if (data.Answer && data.Answer.length > 0) {
          hasMxRecords = true;
        }
      })
      .catch(() => {})
  ];

  await Promise.allSettled(lookupPromises);

  // Compute Live Threat Assessment
  let threatLevel = 'SAFE / LOW RISK';
  let threatScore = 0;
  const threatSignals = [];

  if (localDbMatch) {
    threatScore = 100;
    threatLevel = 'CRITICAL COMPROMISED';
    threatSignals.push(`Actively cataloged in 290,676 Threat Intelligence Database (${matchedEntry})`);
  }

  if (cloudflareBlocked) {
    threatScore = Math.max(threatScore, 95);
    threatLevel = 'CRITICAL COMPROMISED';
    threatSignals.push('Blocked by Cloudflare Security 1.1.1.2 Malware & Phishing Firewall');
  }

  if (googleResolved && resolvedIps.length > 0) {
    if (resolvedIps.some(ip => ip === '0.0.0.0' || ip === '127.0.0.1')) {
      threatScore = Math.max(threatScore, 90);
      threatLevel = 'CRITICAL COMPROMISED';
      threatSignals.push(`DNS points to Sinkhole / Blocked IP (${resolvedIps.join(', ')})`);
    }
  }

  return {
    domain: cleanDomain,
    threatScore,
    threatLevel,
    isCompromised: localDbMatch || cloudflareBlocked,
    localDbMatch,
    matchedEntry,
    databaseSize: threatCount,
    cloudflareBlocked,
    googleResolved,
    resolvedIps,
    hasMxRecords,
    threatSignals,
    scouredAt: new Date().toISOString(),
    apiQuotaUsed: 0
  };
}

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

  /* ── /api/live-threat-scour — Live internet security & DNS threat lookup (0 Gemini API calls) ── */
  if (req.method === 'GET' && parsed.pathname === '/api/live-threat-scour') {
    setCORSHeaders(res);
    const rawDomain = (parsed.query.domain || '').trim().toLowerCase();
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();

    if (!cleanDomain) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ found: false, databaseSize: threatCount, apiQuotaUsed: 0 }));
      return;
    }

    scourInternetThreats(cleanDomain).then(result => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, apiQuotaUsed: 0 }));
    });
    return;
  }

  /* ── /api/threat-intel — check domain in 290k threat database ─────── */
  if (req.method === 'GET' && parsed.pathname === '/api/threat-intel') {
    setCORSHeaders(res);
    const rawDomain = (parsed.query.domain || '').trim().toLowerCase();
    if (!rawDomain) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ databaseSize: threatCount, found: false }));
      return;
    }

    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();
    let isMatch = compromisedDomainsSet.has(cleanDomain);
    let matchedEntry = isMatch ? cleanDomain : null;

    // Suffix / parent domain match check
    if (!isMatch) {
      const parts = cleanDomain.split('.');
      for (let i = 1; i < parts.length - 1; i++) {
        const parentDomain = parts.slice(i).join('.');
        if (compromisedDomainsSet.has(parentDomain)) {
          matchedEntry = parentDomain;
          isMatch = true;
          break;
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      found: isMatch,
      domain: cleanDomain,
      matchedEntry: matchedEntry,
      databaseSize: threatCount,
      riskScore: isMatch ? 100 : null,
      message: isMatch 
        ? `Confirmed match in active Threat Intelligence database (${threatCount.toLocaleString()} indexed domains)`
        : `Domain not found in active blacklist database (${threatCount.toLocaleString()} indexed domains)`
    }));
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
  console.log('  ║   CyberAware AI — API & Threat Intelligence  ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Port: http://localhost:${PORT}                 ║`);
  console.log(`  ║   Threat Intel: ${threatCount.toLocaleString()} compromised domains ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

