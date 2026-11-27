'use strict';

const { HttpError } = require('../http');
const validate = require('../services/validate');
const { randomId } = require('../crypto');
const scanner = require('../services/scanner');
const ai = require('../services/ai');
const { RULES, award, summary } = require('../services/points');
const { EMERGENCY } = require('../content');

const INCIDENT_TYPES = ['Injury', 'Hazardous waste', 'Sharp object', 'Chemical exposure', 'Unsafe area', 'Other', 'SOS'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

function isToday(timestamp) {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function mapsLink(gps) {
  return gps ? 'https://www.google.com/maps?q=' + gps.lat + ',' + gps.lng : '';
}

function shareLinks(incident) {
  const message = 'EMERGENCY SOS ' + incident.id + (mapsLink(incident.gps)
    ? ' — I need help here: ' + mapsLink(incident.gps)
    : ' — please call me.');
  return {
    maps: mapsLink(incident.gps),
    whatsapp: 'https://wa.me/?text=' + encodeURIComponent(message),
    sms: 'sms:?body=' + encodeURIComponent(message),
    call: 'tel:' + EMERGENCY.police
  };
}

function register(router, { db }) {
  router.add('POST', '/api/scans', async ({ ctx, body }) => {
    const hint = validate.text(body.hint || '', 'Description', 0, 120);
    const fileName = validate.text(body.fileName || '', 'File name', 0, 200);
    const result = scanner.analyze({ hint, fileName, stats: body.stats, category: body.category });
    const scan = {
      id: randomId('SCN'),
      userId: ctx.user.id,
      ...result,
      hint,
      fileName,
      at: Date.now()
    };
    await db.insert('scans', scan);
    return { scan };
  }, { auth: true });

  router.add('GET', '/api/scans', async ({ ctx }) => ({
    scans: (await db.filter('scans', (item) => item.userId === ctx.user.id))
      .slice().sort((a, b) => b.at - a.at).slice(0, 30)
  }), { auth: true });

  router.add('POST', '/api/checklists', async ({ ctx, body }) => {
    const existing = await db.find('checklists', (item) => item.userId === ctx.user.id && isToday(item.at));
    if (existing) throw new HttpError(409, 'Today’s safety check is already complete. Come back tomorrow.');
    const items = Array.isArray(body.items) ? body.items.slice(0, 20).map(Boolean) : [];
    const total = Number(body.total) || 7;
    if (!items.length) throw new HttpError(400, 'Mark at least one checklist item.');
    const check = {
      id: randomId('CHK'),
      userId: ctx.user.id,
      itemsDone: items.filter(Boolean).length,
      total,
      at: Date.now()
    };
    await db.insert('checklists', check);
    await award(db, ctx.user.id, RULES.CHECKLIST, 'Daily safety checklist');
    return { check, awarded: RULES.CHECKLIST, progress: await summary(db, ctx.user) };
  }, { auth: true });

  router.add('GET', '/api/checklists', async ({ ctx }) => ({
    checklists: (await db.filter('checklists', (item) => item.userId === ctx.user.id))
      .slice().sort((a, b) => b.at - a.at).slice(0, 20),
    doneToday: (await db.filter('checklists', (item) => item.userId === ctx.user.id && isToday(item.at))).length > 0
  }), { auth: true });

  router.add('POST', '/api/incidents', async ({ ctx, body }) => {
    const type = validate.oneOf(body.type, INCIDENT_TYPES, 'incident category');
    const severity = validate.oneOf(body.severity, SEVERITIES, 'severity');
    const description = validate.text(body.description, 'Description', 5, 1000);
    const incident = {
      id: randomId('INC'),
      userId: ctx.user.id,
      type,
      severity,
      description,
      photo: validate.photo(body.photo),
      gps: validate.gps(body.gps),
      at: Date.now(),
      status: 'reported',
      source: 'report'
    };
    await db.insert('incidents', incident);
    await award(db, ctx.user.id, RULES.INCIDENT, 'Hazard report submitted');
    return { incident, awarded: RULES.INCIDENT, progress: await summary(db, ctx.user) };
  }, { auth: true });

  router.add('GET', '/api/incidents', async ({ ctx }) => ({
    incidents: (await db.filter('incidents', (item) => item.userId === ctx.user.id))
      .slice().sort((a, b) => b.at - a.at).slice(0, 50)
  }), { auth: true });

  router.add('POST', '/api/sos', async ({ ctx, body }) => {
    const synced = Boolean(body.synced);
    const incident = {
      id: randomId('SOS'),
      userId: ctx.user.id,
      type: 'SOS',
      severity: 'high',
      description: validate.text(body.description || 'Emergency SOS alert.', 'Description', 3, 300),
      photo: '',
      gps: validate.gps(body.gps),
      at: Number(body.queuedAt) && Number(body.queuedAt) < Date.now() ? Number(body.queuedAt) : Date.now(),
      status: 'reported',
      source: 'sos',
      synced
    };
    await db.insert('incidents', incident);
    const points = synced ? RULES.SOS_SYNCED : RULES.SOS;
    await award(db, ctx.user.id, points, synced ? 'SOS alert synced' : 'SOS alert sent');
    return {
      incident,
      links: shareLinks(incident),
      numbers: EMERGENCY,
      awarded: points,
      progress: await summary(db, ctx.user)
    };
  }, { auth: true });

  router.add('GET', '/api/sos', async ({ ctx }) => ({
    alerts: (await db.filter('incidents', (item) => item.userId === ctx.user.id && item.source === 'sos'))
      .slice().sort((a, b) => b.at - a.at).slice(0, 30)
  }), { auth: true });

  router.add('POST', '/api/lessons/:lessonId/complete', async ({ ctx, params }) => {
    const { LESSONS } = require('../content');
    const lesson = LESSONS.find((item) => item.id === params.lessonId);
    if (!lesson) throw new HttpError(404, 'Lesson not found.');
    const existing = await db.find('lessonsDone', (item) => item.userId === ctx.user.id && item.lessonId === lesson.id);
    if (existing) return { message: 'Lesson already completed.', awarded: 0, progress: await summary(db, ctx.user) };
    await db.insert('lessonsDone', {
      id: randomId('LES'), userId: ctx.user.id, lessonId: lesson.id, at: Date.now()
    });
    await award(db, ctx.user.id, RULES.LESSON, 'Training lesson completed');
    return { message: 'Lesson complete.', awarded: RULES.LESSON, progress: await summary(db, ctx.user) };
  }, { auth: true });

  router.add('GET', '/api/progress', async ({ ctx }) => await summary(db, ctx.user), { auth: true });

  router.add('POST', '/api/ai/chat', async ({ ctx, body }) => {
    const message = validate.text(body.message, 'Message', 1, 600);
    const allowedLangs = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as'];
    const lang = allowedLangs.includes(body.lang)
      ? body.lang
      : (allowedLangs.includes(ctx.user.lang) ? ctx.user.lang : 'en');
    const reply = await ai.reply(message, {
      lang,
      name: ctx.user.name,
      area: ctx.user.area,
      work: ctx.user.work,
      points: (await summary(db, ctx.user)).points,
      verified: Boolean(ctx.user.idCreated)
    });
    await db.insert('chats', {
      id: randomId('MSG'), userId: ctx.user.id, role: 'user', message, at: Date.now()
    });
    await db.insert('chats', {
      id: randomId('MSG'), userId: ctx.user.id, role: 'assistant', message: reply, at: Date.now()
    });
    return {
      reply,
      provider: ai.status().lastProvider,
      suggestions: lang === 'hi'
        ? ['टूटा कांच?', 'आज का PPE?', 'e-SHRAM कैसे मिले?', 'SOS क्या करता है?']
        : ['Broken glass?', 'PPE today?', 'e-SHRAM eligibility', 'What does SOS do?']
    };
  }, { auth: true });

  router.add('GET', '/api/ai/status', async () => ai.status(), { auth: true });

  router.add('GET', '/api/chat/history', async ({ ctx }) => ({
    messages: (await db.filter('chats', (item) => item.userId === ctx.user.id))
      .slice().sort((a, b) => b.at - a.at).slice(0, 40).reverse()
      .map(({ id, role, message, at }) => ({ id, role, message, at }))
  }), { auth: true });
}

module.exports = { register };
