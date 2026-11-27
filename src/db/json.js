'use strict';

const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config');

const COLLECTIONS = [
  'users', 'sessions', 'otps', 'checklists', 'lessonsDone', 'incidents',
  'scans', 'collections', 'points', 'campRegs', 'chats', 'sos'
];

function emptyState() {
  const state = {};
  for (const name of COLLECTIONS) state[name] = [];
  return state;
}

let state = emptyState();

function load() {
  if (fs.existsSync(DB_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
      const backup = DB_FILE + '.corrupt-' + Date.now();
      fs.copyFileSync(DB_FILE, backup);
      console.error('Database was unreadable; backed up to ' + backup);
      state = emptyState();
    }
  }
  for (const name of COLLECTIONS) {
    if (!Array.isArray(state[name])) state[name] = [];
  }
  return state;
}

function save() {
  const dir = path.dirname(DB_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const temp = DB_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(temp, DB_FILE);
}

function all(name) { return state[name]; }
function find(name, predicate) { return state[name].find(predicate) || null; }
function filter(name, predicate) { return state[name].filter(predicate); }
function insert(name, doc) { state[name].push(doc); save(); return doc; }
function update(name, predicate, patch) {
  const doc = typeof predicate === 'function'
    ? state[name].find(predicate)
    : state[name].find((item) => item.id === predicate);
  if (!doc) return null;
  Object.assign(doc, patch);
  save();
  return doc;
}
function remove(name, predicate) {
  const before = state[name].length;
  state[name] = state[name].filter(
    typeof predicate === 'function' ? (item) => !predicate(item) : (item) => item.id !== predicate
  );
  if (state[name].length !== before) save();
  return before - state[name].length;
}
function mutate(fn) {
  const result = fn(state);
  save();
  return result instanceof Promise ? result.then((value) => { save(); return value; }) : result;
}
function reset() { state = emptyState(); save(); }

load();

module.exports = {
  ready: async () => {},
  load, save, all: async (name) => all(name),
  find: async (name, predicate) => find(name, predicate),
  filter: async (name, predicate) => filter(name, predicate),
  insert: async (name, doc) => insert(name, doc),
  update: async (name, predicate, patch) => update(name, predicate, patch),
  remove: async (name, predicate) => remove(name, predicate),
  mutate: async (fn) => mutate(fn),
  reset: async () => reset(),
  emptyState,
  COLLECTIONS
};