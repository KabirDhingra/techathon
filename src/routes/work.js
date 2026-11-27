'use strict';

const { HttpError } = require('../http');
const validate = require('../services/validate');
const { randomId } = require('../crypto');
const { nearbyCentres } = require('../services/geo');
const { RULES, award } = require('../services/points');
const { CAMPS, TIPS } = require('../content');

const MATERIALS = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Cardboard', 'Other'];

function register(router, { db }) {
  router.add('GET', '/api/centres', async ({ query }) => {
    const pos = query.get('lat') && query.get('lng')
      ? { lat: query.get('lat'), lng: query.get('lng') }
      : null;
    const centres = await nearbyCentres(pos, Number(query.get('radius')) || 12);
    return { centres, source: centres.some((item) => String(item.id).startsWith('OSM-')) ? 'live' : 'seeded' };
  }, { auth: true });

  router.add('POST', '/api/collections', async ({ ctx, body }) => {
    const material = validate.oneOf(body.material, MATERIALS, 'material');
    const kg = Number(body.kg);
    if (!Number.isFinite(kg) || kg <= 0 || kg > 5000) throw new HttpError(400, 'Enter a quantity between 0.1 and 5,000 kg.');
    const collection = {
      id: randomId('COL'),
      userId: ctx.user.id,
      material,
      kg: Math.round(kg * 100) / 100,
      destination: validate.text(body.destination || '', 'Destination', 0, 140),
      gps: validate.gps(body.gps),
      at: Number(body.queuedAt) && Number(body.queuedAt) < Date.now() ? Number(body.queuedAt) : Date.now()
    };
    await db.insert('collections', collection);
    await award(db, ctx.user.id, RULES.COLLECTION, 'Safe collection logged');
    return { collection, awarded: RULES.COLLECTION };
  }, { auth: true });

  router.add('GET', '/api/collections', async ({ ctx }) => ({
    collections: (await db.filter('collections', (item) => item.userId === ctx.user.id))
      .slice().sort((a, b) => b.at - a.at).slice(0, 50)
  }), { auth: true });

  router.add('GET', '/api/history', async ({ ctx }) => {
    const uid = ctx.user.id;
    const items = [];
    for (const collection of await db.filter('collections', (item) => item.userId === uid)) {
      items.push({
        id: collection.id, kind: 'collection', title: collection.material + ' · ' + collection.kg + ' kg',
        detail: collection.destination || 'Collection logged', at: collection.at, gps: collection.gps
      });
    }
    for (const incident of await db.filter('incidents', (item) => item.userId === uid)) {
      items.push({
        id: incident.id, kind: incident.source === 'sos' ? 'sos' : 'incident',
        title: incident.type, detail: incident.description, at: incident.at, status: incident.status, gps: incident.gps
      });
    }
    for (const scan of await db.filter('scans', (item) => item.userId === uid)) {
      items.push({
        id: scan.id, kind: 'scan', title: scan.name,
        detail: scan.risk + ' risk · ' + scan.confidence + '% confidence', at: scan.at
      });
    }
    return { items: items.sort((a, b) => b.at - a.at).slice(0, 60) };
  }, { auth: true });

  router.add('GET', '/api/community', async () => {
    const collections = await db.all('collections');
    const incidents = await db.all('incidents');
    return {
      stats: {
        workers: (await db.filter('users', (item) => item.role === 'worker')).length,
        collectedKg: Math.round(collections.reduce((sum, item) => sum + (Number(item.kg) || 0), 0) * 10) / 10,
        incidents: incidents.filter((item) => item.source === 'report').length,
        hazardsFound: (await db.all('scans')).length + incidents.filter((item) => item.source === 'report').length
      },
      tips: TIPS
    };
  }, { auth: true });

  router.add('POST', '/api/camps/:campId/register', async ({ ctx, params }) => {
    const camp = CAMPS.find((item) => item.id === params.campId);
    if (!camp) throw new HttpError(404, 'Camp not found.');
    const existing = await db.find('campRegs', (item) => item.userId === ctx.user.id && item.campId === camp.id);
    if (existing) return { message: 'You are already registered for this camp.', registered: true };
    await db.insert('campRegs', {
      id: randomId('REG'), userId: ctx.user.id, campId: camp.id, at: Date.now()
    });
    return { message: 'Registered for ' + camp.name + '.', registered: true };
  }, { auth: true });

  router.add('DELETE', '/api/camps/:campId/register', async ({ ctx, params }) => {
    await db.remove('campRegs', (item) => item.userId === ctx.user.id && item.campId === params.campId);
    return { message: 'Registration cancelled.', registered: false };
  }, { auth: true });
}

module.exports = { register };
