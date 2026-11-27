'use strict';

const { HttpError } = require('../http');

function text(value, label, min = 1, max = 300) {
  const clean = String(value == null ? '' : value).trim();
  if (clean.length < min) throw new HttpError(400, label + ' must be at least ' + min + ' character' + (min === 1 ? '' : 's') + '.');
  if (clean.length > max) throw new HttpError(400, label + ' is too long.');
  return clean;
}

function email(value) {
  const clean = text(value, 'Email', 3, 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new HttpError(400, 'Enter a valid email address.');
  return clean;
}

function password(value) {
  const clean = String(value == null ? '' : value);
  if (clean.length < 6 || clean.length > 128) throw new HttpError(400, 'Password must be between 6 and 128 characters.');
  return clean;
}

function phone(value) {
  const clean = String(value == null ? '' : value).replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(clean)) throw new HttpError(400, 'Enter a valid 10-digit Indian mobile number.');
  return clean;
}

function gps(value) {
  if (!value || typeof value !== 'object') return null;
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, accuracy: Number(value.accuracy) || null, at: Date.now() };
}

function photo(value) {
  if (!value) return '';
  const string = String(value);
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(string)) {
    throw new HttpError(400, 'Photo must be a PNG or JPEG image.');
  }
  if (string.length > 9 * 1024 * 1024) throw new HttpError(400, 'Photo is too large.');
  return string;
}

function oneOf(value, allowed, label) {
  if (!allowed.includes(value)) throw new HttpError(400, 'Choose a valid ' + label + '.');
  return value;
}

module.exports = { text, email, password, phone, gps, photo, oneOf };
