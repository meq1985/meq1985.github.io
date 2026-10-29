import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validRegistration, verifyRegistration, registrationCounter, registerProtected } from '../registration.js';
test('registration requires consent, bounded credentials and a challenge', () => {
  const valid = { email: 'qa@example.invalid', password: 'long-password', token: 'single-use', consent: true };
  assert.equal(validRegistration(valid), true);
  for (const patch of [{ consent: false }, { token: '' }, { token: 'x'.repeat(2049) }, { password: 'short' }, { email: 'bad' }]) assert.equal(validRegistration({ ...valid, ...patch }), false);
});
test('challenge validation checks provider, hostname, action and server status', async () => {
  const response = body => async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify'); assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => body };
  };
  assert.equal(await verifyRegistration('secret', 'token', response({ success: true, hostname: 'electricistaxpress.com.ar', action: 'signup' })), true);
  for (const patch of [{ success: false }, { hostname: 'evil.example' }, { action: 'login' }]) assert.equal(await verifyRegistration('secret', 'token', response({ success: true, hostname: 'electricistaxpress.com.ar', action: 'signup', ...patch })), false);
});
test('registration counters cap a rolling day and permit a reset only after 24 hours', () => {
  assert.deepEqual(registrationCounter(undefined, 100, 3), { count: 1, startedAt: 100 });
  assert.throws(() => registrationCounter({ count: 3, startedAt: { toMillis: () => 100 } }, 101, 3));
  assert.deepEqual(registrationCounter({ count: 3, startedAt: { toMillis: () => 100 } }, 86400100, 3), { count: 1, startedAt: 86400100 });
});

test('invalid challenges never touch Firestore or create an Authentication account', async () => {
  let writes = 0;
  await assert.rejects(() => registerProtected({ data: { email: 'qa@example.invalid', password: 'long-password', token: 'invalid', consent: true }, secret: 'private', ip: '127.0.0.1', db: { doc() { writes++; } }, auth: { createUser() { writes++; } }, verify: async () => false }));
  assert.equal(writes, 0);
});
test('valid registrations reserve global and IP limits before account creation and hide existing addresses', async () => {
  const records = new Map(), events = [], secret = 'server-only';
  const db = { doc: path => path, runTransaction: async operation => operation({ get: async path => ({ data: () => records.get(path) }), set: (path, data) => { records.set(path, data); events.push('counter'); } }) };
  const Timestamp = { fromMillis: value => ({ toMillis: () => value }) };
  const input = { data: { email: 'qa@example.invalid', password: 'long-password', token: 'valid', consent: true }, ip: '127.0.0.1', secret, db, Timestamp, verify: async () => true, auth: { createUser: async () => { events.push('account'); throw { code: 'auth/email-already-exists' }; } } };
  assert.deepEqual(await registerProtected(input), { accepted: true });
  assert.deepEqual(events, ['counter', 'counter', 'account']);
  assert.ok([...records.keys()].every(path => !path.includes(input.ip)));
  await registerProtected(input); await registerProtected(input);
  await assert.rejects(() => registerProtected(input), /registration-limit/);
  assert.equal(events.filter(event => event === 'account').length, 3);
});
