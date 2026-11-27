'use strict';

const http = require('http');
const config = require('./src/config');
const db = require('./src/db');
const { readBody, serveStatic, fail, HttpError } = require('./src/http');
const router = require('./src/router');
const { tokenHash } = require('./src/crypto');
const { ensureSeed } = require('./src/seed');

const deps = { db, config };

for (const name of ['auth', 'user', 'content', 'safety', 'work', 'admin']) {
  require('./src/routes/' + name).register(router, deps);
}

router.add('GET', '/api/health', async () => ({ status: 'ok', time: Date.now() }));

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const body = hasBody ? await readBody(req) : {};
      const handled = await router.dispatch(req, res, { db, config, body, hashToken: tokenHash });
      if (handled) return;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        throw new HttpError(404, 'Endpoint not found.');
      }
      const pathname = new URL(req.url, 'http://localhost').pathname;
      serveStatic(res, pathname);
    } catch (err) {
      fail(res, err);
    }
  });
}

async function start() {
  await db.ready();
  await ensureSeed();
  const server = createServer();
  server.listen(config.PORT, config.HOST, () => {
    console.log('SurakshaSetu is running at http://localhost:' + config.PORT);
    console.log('Health check: http://localhost:' + config.PORT + '/api/health');
  });
  return server;
}

if (require.main === module) start();

module.exports = { createServer, start };
