'use strict';

const crypto = require('crypto');
const { randomId, signToken, workerId } = require('../crypto');

function privacyDefaults() {
  return {
    publicProfile: false,
    sharePhone: false,
    sosLocation: true,
    qrVerification: true,
    hazardAlerts: true
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    work: user.work || '',
    area: user.area || '',
    emergencyContact: user.emergencyContact || '',
    wid: user.wid,
    role: user.role || 'worker',
    verified: Boolean(user.verified),
    lang: user.lang || 'en',
    photo: user.photo || '',
    issuedAt: user.issuedAt || null,
    createdAt: user.createdAt || Date.now(),
    idCreated: Boolean(user.idCreated),
    privacy: { ...privacyDefaults(), ...(user.privacy || {}) },
    phoneVerified: Boolean(user.phoneVerified)
  };
}

async function issueOtp(db, key, purpose, length = 6, config) {
  const digits = length === 4 ? 1000 : 100000;
  const max = length === 4 ? 9999 : 999999;
  const code = String(Math.floor(digits + Math.random() * (max - digits + 1)));
  const now = Date.now();
  const codeHash = crypto.createHash('sha256').update(code + ':' + String(key).toLowerCase() + ':' + purpose).digest('hex');
  await db.remove('otps', (item) => item.key === key && item.purpose === purpose);
  await db.insert('otps', {
    id: randomId('OTP'),
    key: String(key).toLowerCase(),
    purpose,
    codeHash,
    attempts: 0,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000
  });
  return config && config.DEMO_MODE ? code : undefined;
}

async function checkOtp(db, key, purpose, code) {
  const otp = await db.find('otps', (item) => item.key === String(key).toLowerCase() && item.purpose === purpose);
  if (!otp) return { ok: false, error: 'No code found. Request a new one.' };
  if (otp.expiresAt < Date.now()) return { ok: false, error: 'This code has expired. Request a new one.' };
  if (otp.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' };
  const suppliedHash = crypto.createHash('sha256').update(String(code || '').trim() + ':' + String(key).toLowerCase() + ':' + purpose).digest('hex');
  if (otp.codeHash !== suppliedHash) {
    await db.update('otps', otp.id, { attempts: otp.attempts + 1 });
    return { ok: false, error: 'Incorrect code. Please try again.' };
  }
  await db.remove('otps', otp.id);
  return { ok: true };
}

async function createSession(db, user, config) {
  const token = signToken(user.id, config.SECRET, config.SESSION_HOURS);
  const crypto = require('../crypto');
  await db.insert('sessions', {
    id: randomId('SES'),
    userId: user.id,
    tokenHash: crypto.tokenHash(token),
    createdAt: Date.now(),
    expiresAt: Date.now() + config.SESSION_HOURS * 3600 * 1000
  });
  return token;
}

async function findUser(db, key) {
  const normalized = String(key || '').trim().toLowerCase();
  return await db.find('users', (user) =>
    (user.email && user.email.toLowerCase() === normalized) ||
    (user.phone && user.phone === normalized)
  );
}

async function generateWorkerId(db) {
  let id = workerId();
  while (await db.find('users', (user) => user.wid === id)) {
    id = workerId();
  }
  return id;
}

module.exports = { privacyDefaults, publicUser, issueOtp, checkOtp, createSession, findUser, generateWorkerId };
