'use strict';

const { HttpError } = require('../http');
const validate = require('../services/validate');
const { randomId, workerId, hashPassword, verifyPassword, tokenHash } = require('../crypto');
const {
  privacyDefaults, publicUser, issueOtp, checkOtp, createSession, findUser, generateWorkerId
} = require('../services/auth-service');
const { RULES, award, summary } = require('../services/points');

function register(router, { db, config }) {
  function demo(code, purpose, key) {
    return {
      key,
      purpose,
      ...(code ? { devCode: code, devNote: 'Demo mode: the code is shown here because no mail/SMS provider is configured.' } : {})
    };
  }

  router.add('GET', '/api/auth/providers', async () => {
    const configured = Boolean(config.FIREBASE_API_KEY);
    return {
      sms: configured ? 'firebase' : 'demo',
      demoMode: Boolean(config.DEMO_MODE),
      firebase: configured ? {
        apiKey: config.FIREBASE_API_KEY,
        projectId: config.FIREBASE_PROJECT_ID || '',
        authDomain: config.FIREBASE_AUTH_DOMAIN || (config.FIREBASE_PROJECT_ID ? config.FIREBASE_PROJECT_ID + '.firebaseapp.com' : '')
      } : null
    };
  });

  router.add('POST', '/api/auth/signup', async ({ body }) => {
    const name = validate.text(body.name, 'Full name', 2, 80);
    const email = validate.email(body.email);
    const password = validate.password(body.password);
    if (await findUser(db, email)) throw new HttpError(409, 'An account with this email already exists.');

    const allowedLangs = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml', 'or', 'as'];
    const lang = allowedLangs.includes(body.lang) ? body.lang : 'en';
    const user = {
      id: randomId('USR'),
      name,
      email,
      phone: '',
      passwordHash: hashPassword(password),
      role: 'worker',
      wid: await generateWorkerId(db),
      work: '',
      area: '',
      emergencyContact: '',
      photo: '',
      verified: false,
      phoneVerified: false,
      lang,
      privacy: privacyDefaults(),
      idCreated: false,
      otpRewarded: false,
      createdAt: Date.now(),
      issuedAt: null
    };
    await db.insert('users', user);
    const code = await issueOtp(db, email, 'signup', 6, config);
    return { message: 'Account created. Verify your email to continue.', ...demo(code, 'signup', email) };
  });

  router.add('POST', '/api/auth/login', async ({ body }) => {
    const key = validate.text(body.email || body.key, 'Email or mobile number', 3, 180).toLowerCase();
    const password = String(body.password || '');
    const user = await findUser(db, key);
    if (!user) throw new HttpError(404, 'No account found. Please create one first.');
    if (!verifyPassword(password, user.passwordHash)) throw new HttpError(401, 'Incorrect password. Please try again.');

    if (!user.verified) {
      const destination = user.email || user.phone;
      const code = await issueOtp(db, destination, 'login', 6, config);
      return { needsVerification: true, message: 'Verify your account to continue.', ...demo(code, 'login', destination) };
    }
    const token = await createSession(db, user, config);
    return {
      token,
      user: publicUser(user),
      profileComplete: Boolean(user.idCreated && user.area),
      progress: await summary(db, user)
    };
  });

  router.add('POST', '/api/auth/verify', async ({ body }) => {
    const key = validate.text(body.key, 'Account', 3, 180).toLowerCase();
    const purpose = validate.oneOf(body.purpose || 'signup', ['signup', 'login', 'phone'], 'verification purpose');
    const code = validate.text(body.code, 'Verification code', 4, 6);

    const result = await checkOtp(db, key, purpose, code);
    if (!result.ok) throw new HttpError(400, result.error);

    if (purpose === 'phone') {
      const digits = key.replace(/\D/g, '');
      const user = await db.find('users', (item) => item.phone === digits);
      if (!user) throw new HttpError(404, 'No account has this mobile number.');
      if (!user.phoneVerified) {
        await db.update('users', user.id, { phoneVerified: true });
        await award(db, user.id, RULES.PHONE_VERIFIED, 'Mobile number verified');
      }
      return { message: 'Mobile number verified.', user: publicUser(await db.find('users', (item) => item.id === user.id)) };
    }

    const user = await findUser(db, key);
    if (!user) throw new HttpError(404, 'Account not found. Please sign up again.');
    const patch = { verified: true };
    if (!user.otpRewarded) {
      patch.otpRewarded = true;
      await award(db, user.id, RULES.OTP_VERIFIED, 'Account verified');
    }
    const updated = await db.update('users', user.id, patch);
    const token = await createSession(db, updated, config);
    return {
      token,
      user: publicUser(updated),
      profileComplete: Boolean(updated.idCreated && updated.area),
      progress: await summary(db, updated)
    };
  });

  router.add('POST', '/api/auth/resend', async ({ body }) => {
    const key = validate.text(body.key, 'Account', 3, 180).toLowerCase();
    const purpose = validate.oneOf(body.purpose || 'signup', ['signup', 'login', 'reset', 'phone'], 'verification purpose');
    const existing = await db.find('otps', (item) => item.key === key && item.purpose === purpose);
    if (existing && Date.now() - existing.createdAt < 30 * 1000) {
      throw new HttpError(429, 'Please wait 30 seconds before asking for another code.');
    }
    const length = purpose === 'phone' ? 4 : 6;
    const code = await issueOtp(db, key, purpose, length, config);
    return { message: 'A new code has been issued.', ...demo(code, purpose, key) };
  });

  router.add('POST', '/api/auth/forgot', async ({ body }) => {
    const key = validate.text(body.email || body.key, 'Email', 3, 180).toLowerCase();
    const user = await findUser(db, key);
    if (!user) throw new HttpError(404, 'No account exists with that email.');
    const code = await issueOtp(db, user.email, 'reset', 6, config);
    return { message: 'Reset code issued.', ...demo(code, 'reset', user.email) };
  });

  router.add('POST', '/api/auth/reset-password', async ({ body }) => {
    const key = validate.text(body.key, 'Email', 3, 180).toLowerCase();
    const code = validate.text(body.code, 'Reset code', 6, 6);
    const password = validate.password(body.newPassword || body.password);
    const result = await checkOtp(db, key, 'reset', code);
    if (!result.ok) throw new HttpError(400, result.error);
    const user = await findUser(db, key);
    if (!user) throw new HttpError(404, 'Account not found.');
    await db.update('users', user.id, { passwordHash: hashPassword(password), verified: true });
    return { message: 'Password updated. You can sign in now.' };
  });

  router.add('POST', '/api/auth/logout', async ({ ctx }) => {
    await db.remove('sessions', (item) => item.tokenHash === tokenHash(ctx.token));
    return { message: 'Signed out.' };
  }, { auth: true });

  router.add('GET', '/api/auth/me', async ({ ctx }) => {
    return {
      user: publicUser(ctx.user),
      profileComplete: Boolean(ctx.user.idCreated && ctx.user.area),
      progress: await summary(db, ctx.user)
    };
  }, { auth: true });
}

module.exports = { register };
