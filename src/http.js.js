'use strict';

const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR, MAX_BODY_BYTES } = require('./config');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function fail(res, err) {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error('[server error]', err);
  json(res, status, {
    ok: false,
    error: status >= 500 ? 'Something went wrong. Please try again.' : err.message
  });
}

function readBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'Upload is too large (maximum 12 MB).'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch (_) {
        reject(new HttpError(400, 'Invalid request body.'));
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8'
};

function serveStatic(res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (_) {
    throw new HttpError(400, 'Bad path.');
  }
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const safe = normalized === '/' || normalized === '\\' ? 'index.html' : normalized;
  let filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) throw new HttpError(403, 'Forbidden');

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (_) {
    stat = null;
  }
  if (stat && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!path.extname(filePath)) filePath = path.join(PUBLIC_DIR, 'index.html');
  try {
    stat = fs.statSync(filePath);
  } catch (_) {
    stat = null;
  }
  if (!stat || !stat.isFile()) throw new HttpError(404, 'File not found.');

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...(filePath.endsWith('sw.js') ? { 'Service-Worker-Allowed': '/' } : {})
  });
  fs.createReadStream(filePath).pipe(res);
}

module.exports = { HttpError, json, fail, readBody, serveStatic };
