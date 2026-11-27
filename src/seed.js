'use strict';

const db = require('./db');
const { hashPassword, workerId } = require('./crypto');
const { privacyDefaults } = require('./services/auth-service');
const { RULES, award } = require('./services/points');

const DAY = 24 * 60 * 60 * 1000;

function makeUser({ name, email, password, role = 'worker', area, work, phone, verified = true, wid }) {
  const now = Date.now();
  return {
    id: 'USR-' + name.replace(/\s+/g, '').toUpperCase().slice(0, 6) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    name,
    email,
    phone: phone || '',
    passwordHash: hashPassword(password),
    role,
    wid: wid || workerId(),
    work: work || 'Waste Collector',
    area: area || 'Rohini, Delhi',
    emergencyContact: phone ? '9876500000' : '',
    photo: '',
    verified,
    phoneVerified: verified,
    lang: 'en',
    privacy: privacyDefaults(),
    idCreated: verified,
    createdAt: now - 30 * DAY,
    issuedAt: now - 30 * DAY
  };
}

async function ensureSeed() {
  if (await db.find('users', (user) => user.email === 'worker@demo.in')) return;

  const worker = makeUser({
    name: 'Ramesh Kumar', email: 'worker@demo.in', password: 'Demo@123',
    area: 'Rohini, Delhi', work: 'Waste Collector', phone: '9876543210', wid: 'SS-10428'
  });
  const admin = makeUser({
    name: 'MCD Administrator', email: 'admin@surakshasetu.in', password: 'Admin@123',
    role: 'admin', area: 'Delhi', work: 'MCD Admin', phone: '9876543211', wid: 'SS-90001'
  });
  const second = makeUser({
    name: 'Sunita Devi', email: 'sunita@demo.in', password: 'Demo@123',
    area: 'Mundka, Delhi', work: 'Waste Sorter', phone: '9876543212', wid: 'SS-20817'
  });
  const third = makeUser({
    name: 'Arjun Singh', email: 'arjun@demo.in', password: 'Demo@123',
    area: 'Bawana, Delhi', work: 'Scrap Collector', phone: '9876543213', wid: 'SS-31642'
  });

  await db.mutate((state) => {
    state.users.push(worker, admin, second, third);
  });

  const materialSets = [
    ['Plastic', 6.5], ['Paper', 4], ['Metal', 8], ['Glass', 3.5], ['Plastic', 5]
  ];
  for (let index = 0; index < materialSets.length; index += 1) {
    const [material, kg] = materialSets[index];
    for (const user of [worker, second, third]) {
      if (index > 2 && user === third) continue;
      await db.insert('collections', {
        id: 'COL-' + index + '-' + user.wid,
        userId: user.id,
        material,
        kg,
        destination: 'Rohini Recycling Point',
        gps: { lat: 28.6885 + index * 0.001, lng: 77.119 },
        at: Date.now() - index * DAY - Math.random() * 6 * 3600 * 1000
      });
      await award(db, user.id, RULES.COLLECTION, 'Safe collection logged');
    }
  }

  const incidentSeeds = [
    { type: 'Sharp object', severity: 'high', desc: 'Broken glass near the Rohini drop-off point.' },
    { type: 'Hazardous waste', severity: 'medium', desc: 'Unlabelled chemical container found in a sack.' },
    { type: 'Unsafe area', severity: 'low', desc: 'Loose wire across the walking path.' }
  ];
  for (let index = 0; index < incidentSeeds.length; index += 1) {
    const item = incidentSeeds[index];
    await db.insert('incidents', {
      id: 'INC-SEED-' + index,
      userId: index === 1 ? second.id : worker.id,
      type: item.type,
      severity: item.severity,
      description: item.desc,
      photo: '',
      gps: { lat: 28.69, lng: 77.12 },
      at: Date.now() - index * 2 * DAY,
      status: index === 0 ? 'reported' : 'reviewing',
      source: 'report'
    });
    await award(db, index === 1 ? second.id : worker.id, RULES.INCIDENT, 'Hazard report submitted');
  }

  await db.insert('checklists', {
    id: 'CHK-SEED', userId: worker.id, itemsDone: 7, total: 7, at: Date.now() - DAY
  });
  await award(db, worker.id, RULES.CHECKLIST, 'Daily safety checklist');
  await db.insert('lessonsDone', { id: 'LES-SEED', userId: worker.id, lessonId: 'ppe-basics', at: Date.now() - 2 * DAY });
  await award(db, worker.id, RULES.LESSON, 'Training lesson completed');

  await db.insert('scans', {
    id: 'SCN-SEED', userId: worker.id, hazardId: 'sharp-glass', name: 'Broken glass and sharp objects',
    risk: 'high', confidence: 88, source: 'image+keywords', hint: 'glass', at: Date.now() - 2 * DAY
  });

  console.log('Seeded demo accounts: worker@demo.in / Demo@123 and admin@surakshasetu.in / Admin@123');
}

module.exports = { ensureSeed };