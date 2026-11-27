'use strict';

const db = require('../src/db');
const { createServer } = require('../server');
const { ensureSeed } = require('../src/seed');

let serverPromise = null;

function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      await db.ready();
      await ensureSeed();
      return createServer();
    })();
  }
  return serverPromise;
}

module.exports = async (req, res) => {
  const server = await getServer();
  server.emit('request', req, res);
};