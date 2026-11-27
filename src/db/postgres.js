'use strict';

const { Pool } = require('pg');

const COLLECTIONS = [
  'users', 'sessions', 'otps', 'checklists', 'lessonsDone', 'incidents',
  'scans', 'collections', 'points', 'campRegs', 'chats', 'sos'
];

let pool = null;

function connectionString() {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

function sslOption(connectionString) {
  if (/localhost|127\.0\.0\.1/.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

async function ready() {
  if (pool) return;
  const connectionStringValue = connectionString();
  if (!connectionStringValue) throw new Error('POSTGRES_URL or DATABASE_URL is required for Postgres storage.');
  pool = new Pool({
    connectionString: connectionStringValue,
    ssl: sslOption(connectionStringValue)
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ss_documents (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL,
      PRIMARY KEY (collection, id)
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS ss_documents_collection_idx ON ss_documents(collection)');
}

function all(name) {
  return ready().then(() => pool.query('SELECT data FROM ss_documents WHERE collection = $1', [name]))
    .then((result) => result.rows.map((row) => row.data));
}

async function find(name, predicate) {
  const rows = await all(name);
  return rows.find(predicate) || null;
}

async function filter(name, predicate) {
  const rows = await all(name);
  return rows.filter(predicate);
}

async function insert(name, doc) {
  await ready();
  await pool.query(
    'INSERT INTO ss_documents (collection, id, data) VALUES ($1, $2, $3) ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data',
    [name, doc.id, doc]
  );
  return doc;
}

async function update(name, predicate, patch) {
  const rows = await all(name);
  const doc = typeof predicate === 'function'
    ? rows.find(predicate)
    : rows.find((item) => item.id === predicate);
  if (!doc) return null;
  Object.assign(doc, patch);
  await insert(name, doc);
  return doc;
}

async function remove(name, predicate) {
  const rows = await all(name);
  const toDelete = typeof predicate === 'function'
    ? rows.filter(predicate)
    : rows.filter((item) => item.id === predicate);
  if (!toDelete.length) return 0;
  await ready();
  for (const doc of toDelete) {
    await pool.query('DELETE FROM ss_documents WHERE collection = $1 AND id = $2', [name, doc.id]);
  }
  return toDelete.length;
}

async function mutate(fn) {
  await ready();
  // A transaction must run on one dedicated client; pool.query() may hand each
  // statement a different connection.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const state = {};
    for (const name of COLLECTIONS) {
      const result = await client.query('SELECT data FROM ss_documents WHERE collection = $1', [name]);
      state[name] = result.rows.map((row) => row.data);
    }
    const result = await fn(state);
    for (const name of COLLECTIONS) {
      await client.query('DELETE FROM ss_documents WHERE collection = $1', [name]);
    }
    for (const name of COLLECTIONS) {
      for (const doc of state[name]) {
        await client.query(
          'INSERT INTO ss_documents (collection, id, data) VALUES ($1, $2, $3)',
          [name, doc.id, doc]
        );
      }
    }
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

async function reset() {
  await ready();
  for (const name of COLLECTIONS) {
    await pool.query('DELETE FROM ss_documents WHERE collection = $1', [name]);
  }
}

function emptyState() {
  const state = {};
  for (const name of COLLECTIONS) state[name] = [];
  return state;
}

module.exports = {
  ready,
  load: async () => {},
  save: async () => {},
  all,
  find,
  filter,
  insert,
  update,
  remove,
  mutate,
  reset,
  close,
  emptyState,
  COLLECTIONS
};