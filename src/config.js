'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const hasPostgres = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
const DATA_DIR = process.env.SS_DATA_DIR
  ? path.resolve(process.env.SS_DATA_DIR)
  : (hasPostgres ? path.join(require('os').tmpdir(), 'surakshasetu') : path.join(ROOT, 'data'));

if (!hasPostgres) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let secret = process.env.SS_SECRET;
if (!secret && !hasPostgres) {
  const secretFile = path.join(DATA_DIR, '.secret');
  try {
    secret = fs.readFileSync(secretFile, 'utf8').trim();
  } catch (_) {
    secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, secret, { mode: 0o600 });
  }
}
if (!secret) {
  // On serverless hosts the secret must be provided through SS_SECRET.
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('SS_SECRET is not set; using an ephemeral secret. Set SS_SECRET for stable sessions.');
}

module.exports = {
  ROOT,
  DATA_DIR,
  PUBLIC_DIR: path.join(ROOT, 'public'),
  DB_FILE: path.join(DATA_DIR, 'db.json'),
  PORT: Number(process.env.PORT || 4173),
  HOST: process.env.HOST || '0.0.0.0',
  SECRET: secret,
  SESSION_HOURS: Number(process.env.SS_SESSION_HOURS || 72),
  DEMO_MODE: process.env.SS_DEMO_MODE !== 'false',
  MAX_BODY_BYTES: 12 * 1024 * 1024,
  // Free phone verification through Firebase Authentication (Identity Platform).
  // The web API key is a public identifier; it is protected by authorised domains.
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || process.env.SS_FIREBASE_API_KEY || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.SS_FIREBASE_PROJECT_ID || '',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || process.env.SS_FIREBASE_AUTH_DOMAIN || ''
};
