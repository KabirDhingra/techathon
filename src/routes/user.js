'use strict';

const { HttpError } = require('../http');
const validate = require('../services/validate');
const { publicUser, checkOtp, issueOtp } = require('../services/auth-service');
const { RULES, award, summary } = require('../services/points');

function isToday(timestamp) {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function register(router, { db, config }) {
  router.add('GET', '/api/user/dashboard', async ({ ctx }) => {
    const uid = ctx.user.id;
    const collections = await db.filter('collections', (item) => item.userId === uid);
    const incidents = await db.filter('incidents', (item) => item.userId === uid);
    const scans = await db.filter('scans', (item) => item.userId === uid);
    const checks = await db.filter('checklists', (item) => item.userId === uid);
    const todayKg = collections
      .filter((item) => isToday(item.at))
      .reduce((sum, item) => sum + (Number(item.kg) || 0), 0);

    return {
      user: publicUser(ctx.user),
      stats: {
        todayKg: Math.round(todayKg * 10) / 10,
        collections: collections.length,
        incidents: incidents.length,
        scans: scans.length,
        checksToday: checks.filter((item) => isToday(item.at)).length,
        points: (await summary(db, ctx.user)).points
      },
      recent: {
        collections: collections.slice().sort((a, b) => b.at - a.at).slice(0, 4),
        incidents: incidents.slice().sort((a, b) => b.at - a.at).slice(0, 3)
      },
      progress: await summary(db, ctx.user)
    };
  }, { auth: true });

  router.add('PATCH', '/api/user/profile', async ({ ctx, body }) => {
    const patch = {};
    if (body.name !== undefined) patch.name = validate.text(body.name, 'Full name', 2, 80);
    if (body.area !== undefined) patch.area = validate.text(body.area, 'Area', 2, 120);
    if (body.work !== undefined) patch.work = validate.text(body.work, 'Work category', 2, 80);
    if (body.emergencyContact !== undefined && String(body.emergencyContact).trim()) {
      patch.emergencyContact = validate.phone(body.emergencyContact);
    }
    if (body.photo !== undefined) patch.photo = validate.photo(body.photo);
    if (body.lang !== undefined) patch.lang = validate.oneOf(body.lang, ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as'], 'language');

    const merged = { ...ctx.user, ...patch };
    let awardedId = false;
    if (!merged.idCreated && merged.name && merged.area && merged.work) {
      patch.idCreated = true;
      patch.issuedAt = Date.now();
      await award(db, ctx.user.id, RULES.ID_CREATED, 'Digital ID created');
      awardedId = true;
    }
    const user = await db.update('users', ctx.user.id, patch);
    return {
      user: publicUser(user),
      profileComplete: Boolean(user.idCreated && user.area),
      idAwarded: awardedId,
      message: awardedId ? 'Your verified digital ID is ready.' : 'Profile saved.'
    };
  }, { auth: true });

  router.add('POST', '/api/user/phone/send', async ({ ctx, body }) => {
    const digits = validate.phone(body.phone);
    const taken = await db.find('users', (item) => item.phone === digits && item.id !== ctx.user.id);
    if (taken) throw new HttpError(409, 'This mobile number belongs to another account.');
    const code = await issueOtp(db, digits, 'phone', 4, config);
    return { phone: digits, message: 'Verification code issued.', devCode: code };
  }, { auth: true });

  // Firebase Phone Auth: the client completes the SMS challenge and sends the
  // resulting ID token. Google validates it; we only need the public API key.
  router.add('POST', '/api/user/phone/firebase', async ({ ctx, body }) => {
    if (!config.FIREBASE_API_KEY) throw new HttpError(503, 'Phone verification is not configured on this server.');
    const idToken = validate.text(body.idToken, 'Verification token', 20, 5000);
    let response;
    try {
      response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(config.FIREBASE_API_KEY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
    } catch (_) {
      throw new HttpError(502, 'Could not reach the phone verification service. Please try again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.users) || !data.users.length) {
      throw new HttpError(401, 'That verification token is invalid or has expired.');
    }
    const phoneNumber = String(data.users[0].phoneNumber || '');
    if (!phoneNumber) throw new HttpError(400, 'No verified mobile number was found in that token.');

    const digits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) throw new HttpError(400, 'Only Indian mobile numbers are supported.');
    const taken = await db.find('users', (item) => item.phone === digits && item.id !== ctx.user.id);
    if (taken) throw new HttpError(409, 'This mobile number is already in use.');
    if (!ctx.user.phoneVerified) await award(db, ctx.user.id, RULES.PHONE_VERIFIED, 'Mobile number verified');
    const user = await db.update('users', ctx.user.id, { phone: digits, phoneVerified: true });
    return { user: publicUser(user), phone: digits, message: 'Mobile number verified.' };
  }, { auth: true });

  router.add('POST', '/api/user/phone/verify', async ({ ctx, body }) => {
    const digits = validate.phone(body.phone);
    const code = validate.text(body.code, 'Verification code', 4, 4);
    const result = await checkOtp(db, digits, 'phone', code);
    if (!result.ok) throw new HttpError(400, result.error);
    const taken = await db.find('users', (item) => item.phone === digits && item.id !== ctx.user.id);
    if (taken) throw new HttpError(409, 'This mobile number is already in use.');
    if (!ctx.user.phoneVerified) await award(db, ctx.user.id, RULES.PHONE_VERIFIED, 'Mobile number verified');
    const user = await db.update('users', ctx.user.id, { phone: digits, phoneVerified: true });
    return { user: publicUser(user), message: 'Mobile number verified.' };
  }, { auth: true });

  router.add('GET', '/api/user/id', async ({ ctx }) => {
    const user = ctx.user;
    if (!user.idCreated) throw new HttpError(400, 'Complete your profile to create a digital ID.');
    return {
      wid: user.wid,
      name: user.name,
      work: user.work,
      area: user.area,
      photo: user.photo || '',
      emergencyContact: user.emergencyContact || '',
      issuedAt: user.issuedAt || user.createdAt,
      verified: true,
      privacy: publicUser(user).privacy
    };
  }, { auth: true });

  router.add('GET', '/api/id/verify/:wid', async ({ params }) => {
    const wid = params.wid.toUpperCase();
    const user = await db.find('users', (item) => String(item.wid).toUpperCase() === wid);
    if (!user) throw new HttpError(404, 'No worker found with this ID.');
    const privacy = publicUser(user).privacy;
    if (!privacy.qrVerification) throw new HttpError(403, 'This worker has turned off public QR verification.');
    if (!privacy.publicProfile && !user.idCreated) throw new HttpError(403, 'This ID is not active.');
    return {
      name: user.name,
      wid: user.wid,
      work: user.work || 'Waste Collector',
      area: user.area || 'Delhi',
      issuedAt: user.issuedAt || user.createdAt,
      status: 'Active',
      verified: Boolean(user.verified && user.idCreated),
      phoneHidden: true
    };
  });

  router.add('GET', '/api/user/privacy', async ({ ctx }) => {
    return { privacy: publicUser(ctx.user).privacy };
  }, { auth: true });

  router.add('PATCH', '/api/user/privacy', async ({ ctx, body }) => {
    const allowed = ['publicProfile', 'sharePhone', 'sosLocation', 'qrVerification', 'hazardAlerts'];
    const current = publicUser(ctx.user).privacy;
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = Boolean(body[key]);
    }
    if (!Object.keys(patch).length) throw new HttpError(400, 'No privacy setting was provided.');
    const user = await db.update('users', ctx.user.id, { privacy: { ...current, ...patch } });
    return { privacy: publicUser(user).privacy, message: 'Privacy settings saved.' };
  }, { auth: true });
}

module.exports = { register };
