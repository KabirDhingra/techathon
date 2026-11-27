'use strict';

const crypto = require('crypto');

function randomId(prefix = 'ID') {
  return prefix + '-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

function workerId() {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i += 1) suffix += alphabet[bytes[i] % alphabet.length];
  return 'SS-' + year + '-' + suffix;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || stored.indexOf(':') < 0) return false;
  const parts = stored.split(':');
  const expected = Buffer.from(parts[1], 'hex');
  const actual = crypto.scryptSync(String(password), parts[0], expected.length || 64);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function signToken(userId, secret, hours) {
  const now = Date.now();
  const payload = { uid: userId, iat: now, exp: now + hours * 3600 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

function verifyToken(token, secret) {
  if (typeof token !== 'string' || token.split('.').length !== 2) return null;
  const parts = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { randomId, workerId, hashPassword, verifyPassword, signToken, verifyToken, tokenHash };
