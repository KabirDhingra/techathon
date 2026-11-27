'use strict';

const { randomId } = require('../crypto');

const RULES = Object.freeze({
  OTP_VERIFIED: 10,
  PHONE_VERIFIED: 10,
  ID_CREATED: 50,
  CHECKLIST: 20,
  LESSON: 25,
  INCIDENT: 15,
  COLLECTION: 10,
  SOS: 10,
  SOS_SYNCED: 5
});

async function award(db, userId, amount, reason) {
  const entry = {
    id: randomId('PT'),
    userId,
    amount: Number(amount) || 0,
    reason,
    at: Date.now()
  };
  await db.insert('points', entry);
  return entry;
}

async function total(db, userId) {
  const rows = await db.filter('points', (item) => item.userId === userId);
  return rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function levelFromPoints(points) {
  return Math.floor(points / 500) + 1;
}

async function summary(db, user) {
  const userId = user.id;
  const points = await total(db, userId);
  const level = levelFromPoints(points);
  const intoLevel = points % 500;
  const checks = await db.filter('checklists', (item) => item.userId === userId);
  const incidents = await db.filter('incidents', (item) => item.userId === userId);
  const collections = await db.filter('collections', (item) => item.userId === userId);
  const lessons = await db.filter('lessonsDone', (item) => item.userId === userId);

  const achievements = [
    { id: 'first-check', label: 'First safety check', icon: 'shield', earned: checks.length >= 1 },
    { id: 'reporter', label: 'Hazard reporter', icon: 'alert', earned: incidents.filter((i) => i.type !== 'SOS').length >= 5 },
    { id: 'logger', label: 'Collection logger', icon: 'box', earned: collections.length >= 5 },
    { id: 'learner', label: 'Safety scholar', icon: 'cap', earned: lessons.length >= 3 },
    { id: 'champion', label: '1,000 point champion', icon: 'trophy', earned: points >= 1000 },
    { id: 'verified', label: 'Verified digital ID', icon: 'id', earned: Boolean(user.idCreated || user.verified) }
  ];

  return {
    points,
    level,
    intoLevel,
    needed: 500 - intoLevel,
    progress: Math.round((intoLevel / 500) * 100),
    achievements,
    history: (await db.filter('points', (item) => item.userId === userId))
      .slice()
      .sort((a, b) => b.at - a.at)
      .slice(0, 25)
      .map(({ id, amount, reason, at }) => ({ id, amount, reason, at }))
  };
}

module.exports = { RULES, award, total, summary, levelFromPoints };
