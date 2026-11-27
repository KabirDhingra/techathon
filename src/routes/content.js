'use strict';

const { HAZARDS, LESSONS, SCHEMES, TIPS, CAMPS, EMERGENCY } = require('../content');

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesWork(userWork, allowedWorks) {
  if (!allowedWorks || !allowedWorks.length) return true;
  const work = normalize(userWork);
  return allowedWorks.some((allowed) => {
    const item = normalize(allowed);
    if (!item || work.includes(item) || item.includes(work)) return true;
    const roots = ['collect', 'sort', 'recycl', 'sanit', 'sweep', 'waste', 'scrap'];
    return roots.some((root) => work.includes(root) && item.includes(root));
  });
}

function isDelhi(area) {
  return /delhi|ncr|rohini|bawana|mundka|narela|dwarka|okhla|seelampur|badarpur|najafgarh/i.test(area || '');
}

function register(router, { db }) {
  router.add('GET', '/api/content/hazards', async () => ({ hazards: HAZARDS }), { auth: true });

  router.add('GET', '/api/content/lessons', async ({ ctx }) => {
    const done = (await db.filter('lessonsDone', (item) => item.userId === ctx.user.id)).map((item) => item.lessonId);
    return { lessons: LESSONS.map((lesson) => ({ ...lesson, completed: done.includes(lesson.id) })) };
  }, { auth: true });

  router.add('GET', '/api/content/schemes', async ({ ctx }) => {
    const schemes = SCHEMES.map((scheme) => {
      const eligible = (!scheme.delhiOnly || isDelhi(ctx.user.area)) && matchesWork(ctx.user.work, scheme.works);
      return { ...scheme, eligible };
    });
    return { schemes };
  }, { auth: true });

  router.add('GET', '/api/content/tips', async () => ({ tips: TIPS }), { auth: true });

  router.add('GET', '/api/content/camps', async ({ ctx }) => {
    const registered = (await db.filter('campRegs', (item) => item.userId === ctx.user.id)).map((item) => item.campId);
    return { camps: CAMPS.map((camp) => ({ ...camp, registered: registered.includes(camp.id) })) };
  }, { auth: true });

  router.add('GET', '/api/content/emergency', async () => ({ numbers: EMERGENCY }), { auth: true });
}

module.exports = { register, matchesWork, isDelhi };
