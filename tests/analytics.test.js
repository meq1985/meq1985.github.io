// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { createAnalytics, CONSENT_KEY } from '../src/services/analytics';
function fixture(hostname = 'electricistaxpress.com.ar') {
  const storage = new Map();
  const win = { location: { hostname }, localStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) } };
  const document = { cookie: '', createElement: () => ({}), head: { append: vi.fn() } };
  return { win, document, analytics: createAnalytics(win, document), storage };
}
it('does not load Google or queue any event without consent, including after rejection', () => {
  const { analytics:a,win,document } = fixture(); a.start('/'); a.page('/registrarse'); a.event('trial_interest');
  expect(document.head.append).not.toHaveBeenCalled(); expect(win.dataLayer).toBeUndefined();
  a.apply('denied'); a.event('trial_start'); expect(win.dataLayer).toBeUndefined();
});
it('never sends preview/local traffic even after consent', () => {
  for (const host of ['127.0.0.1','localhost','electricistaxpress--preview.web.app']) {
    const f=fixture(host); f.analytics.apply('granted'); expect(f.document.head.append).not.toHaveBeenCalled();
  }
});
it('loads once, disables advertising and does not replay pre-consent events', () => {
  const f=fixture(); f.analytics.start('/'); f.analytics.event('trial_interest'); f.analytics.apply('granted');
  f.analytics.page('/');
  const commands=f.win.dataLayer.map(x=>Array.from(x));
  expect(f.document.head.append).toHaveBeenCalledTimes(1);
  expect(commands.filter(x=>x[0]==='event').map(x=>x[1])).toEqual(['page_view']);
  expect(commands.find(x=>x[0]==='config')[2]).toMatchObject({send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
  expect(commands.find(x=>x[0]==='consent')[2]).toMatchObject({ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  f.analytics.apply('granted'); expect(f.document.head.append).toHaveBeenCalledTimes(1);
});
it('drops sensitive URLs, arbitrary parameters and unknown events', () => {
  const f=fixture();f.analytics.start('/proyectos/private-client/editar?email=private@example.test#secret');f.analytics.apply('granted');
  f.analytics.page('/dashboard');f.analytics.page('/registrarse');f.analytics.event('begin_checkout',{plan:'croquis',email:'private@example.test',customer:'secret'});f.analytics.event('purchase',{value:19900});
  const raw=JSON.stringify(f.win.dataLayer.map(x=>Array.from(x)));
  expect(raw).not.toMatch(/private|secret|customer|purchase|dashboard/);
  expect(raw).toContain('croquis');expect(raw).toContain('/registrarse');
});
it('revocation disables future events, retains the rejection preference and clears GA cookies', () => {
  const f=fixture();f.analytics.apply('granted');f.document.cookie='_ga=abc; _ga_TAG=abc';f.analytics.apply('denied');
  const count=f.win.dataLayer.length;f.analytics.event('trial_start');f.analytics.page('/');
  expect(f.win.dataLayer).toHaveLength(count);expect(f.win['ga-disable-G-J2R5497R0F']).toBe(true);expect(f.storage.get(CONSENT_KEY)).toBe('denied');expect(f.document.cookie).toContain('Max-Age=0');
});
it('fails safely when browser preference storage is unavailable', () => {
  const f=fixture();f.win.localStorage.getItem=()=>{throw Error('blocked');};f.win.localStorage.setItem=()=>{throw Error('blocked');};
  expect(f.analytics.consent()).toBe(null);expect(()=>f.analytics.apply('denied')).not.toThrow();
});
