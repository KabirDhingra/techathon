'use strict';

const { HttpError } = require('../http');
const validate = require('../services/validate');
const { total } = require('../services/points');

const ZONES = ['Rohini', 'Bawana', 'Mundka', 'Narela', 'Dwarka', 'Najafgarh'];
const STAGES = ['reported', 'received', 'reviewing', 'resolved'];

function register(router, { db }) {
  router.add('GET', '/api/admin/overview', async () => {
    const workers = await db.filter('users', (item) => item.role === 'worker');
    const incidents = await db.all('incidents');
    const collections = await db.all('collections');
    const scans = await db.all('scans');

    const days = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(Date.now() - index * 86400000);
      days.push({
        label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        count: incidents.filter((item) => new Date(item.at).toDateString() === date.toDateString()).length
      });
    }

    const hazardCounts = {};
    for (const scan of scans) hazardCounts[scan.name] = (hazardCounts[scan.name] || 0) + 1;
    for (const incident of incidents) {
      if (incident.source !== 'sos') hazardCounts[incident.type] = (hazardCounts[incident.type] || 0) + 1;
    }
    const hazardMix = Object.entries(hazardCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const materialTotals = {};
    for (const item of collections) {
      materialTotals[item.material] = (materialTotals[item.material] || 0) + (Number(item.kg) || 0);
    }

    const zoneRisk = ZONES.map((zone, index) => {
      let score = 0;
      for (const incident of incidents) {
        const haystack = String(incident.description || '') + ' ' + String((workers.find((w) => w.id === incident.userId) || {}).area || '');
        if (haystack.toLowerCase().includes(zone.toLowerCase())) score += index % 3 === 0 ? 2 : 1;
      }
      const level = score >= 5 ? 'critical' : score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
      return { zone, level, count: score };
    });

    const directory = await Promise.all(workers.map(async (worker) => ({
      name: worker.name,
      wid: worker.wid,
      area: worker.area || '—',
      work: worker.work || 'Waste Collector',
      verified: Boolean(worker.verified && worker.idCreated),
      points: await total(db, worker.id)
    })));

    return {
      metrics: {
        workers: workers.length,
        incidents: incidents.length,
        sosAlerts: incidents.filter((item) => item.source === 'sos').length,
        kgRecovered: Math.round(collections.reduce((sum, item) => sum + (Number(item.kg) || 0), 0) * 10) / 10,
        scans: scans.length,
        checklists: (await db.all('checklists')).length,
        lessons: (await db.all('lessonsDone')).length
      },
      weeklyIncidents: days,
      hazardMix,
      materialTotals: Object.entries(materialTotals)
        .map(([material, kg]) => ({ material, kg: Math.round(kg * 10) / 10 }))
        .sort((a, b) => b.kg - a.kg),
      zoneRisk,
      directory,
      recentIncidents: incidents.slice().sort((a, b) => b.at - a.at).slice(0, 12).map((item) => ({
        id: item.id,
        type: item.type,
        severity: item.severity,
        status: item.status,
        at: item.at,
        source: item.source,
        worker: (workers.find((worker) => worker.id === item.userId) || {}).name || 'Unknown'
      }))
    };
  }, { admin: true });

  router.add('PATCH', '/api/admin/incidents/:id/status', async ({ params, body }) => {
    const stage = validate.oneOf(body.status, STAGES, 'status');
    const incident = await db.update('incidents', params.id, { status: stage });
    if (!incident) throw new HttpError(404, 'Incident not found.');
    return { incident: { id: incident.id, status: incident.status }, stages: STAGES };
  }, { admin: true });
}

module.exports = { register };
