'use strict';

const { HttpError, json, fail } = require('./http');

const routes = [];

function compile(pattern) {
  const names = [];
  const source = pattern.replace(/:([A-Za-z0-9_]+)/g, (_, name) => {
    names.push(name);
    return '([^/]+)';
  });
  return { regex: new RegExp('^' + source + '/?$'), names };
}

function add(method, pattern, handler, options = {}) {
  routes.push({ method, pattern, handler, options, ...compile(pattern) });
}

async function dispatch(req, res, base) {
  try {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch (_) {
      throw new HttpError(400, 'Bad request URL.');
    }
    const pathname = url.pathname;
    if (!pathname.startsWith('/api/')) return false;

    const route = routes.find((item) => item.method === req.method && item.regex.test(pathname));
    if (!route) throw new HttpError(404, 'Endpoint not found.');

    const matched = pathname.match(route.regex);
    const params = {};
    route.names.forEach((name, index) => {
      params[name] = decodeURIComponent(matched[index + 1]);
    });

    const ctx = { ...base, params, query: url.searchParams, path: pathname };

    if (route.options.auth || route.options.admin) {
      const header = String(req.headers.authorization || '');
      const token = header.replace(/^Bearer\s+/i, '').trim();
      const session = token
        ? await ctx.db.find('sessions', (item) => item.tokenHash === ctx.hashToken(token))
        : null;
      if (!session || session.expiresAt < Date.now()) {
        throw new HttpError(401, 'Your session has expired. Please sign in again.');
      }
      const user = await ctx.db.find('users', (item) => item.id === session.userId);
      if (!user) throw new HttpError(401, 'Please sign in again.');
      ctx.user = user;
      ctx.session = session;
      ctx.token = token;
    }

    if (route.options.admin && ctx.user.role !== 'admin') {
      throw new HttpError(403, 'This area is for municipal administrators.');
    }

    // Expose one flat context plus a `ctx` alias so route modules can use either style.
    const result = await route.handler({ ...ctx, ctx });
    if (res.writableEnded) return true;
    const payload = result && typeof result === 'object' ? result : {};
    const status = payload._status || 200;
    const { _status, ...body } = payload;
    json(res, status, { ok: true, ...body });
    return true;
  } catch (err) {
    fail(res, err);
    return true;
  }
}

module.exports = { add, dispatch, routes, HttpError };
