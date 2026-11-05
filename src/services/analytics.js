// Public GA4 identifier. No Google request is made before optional consent.
export const MEASUREMENT_ID = 'G-J2R5497R0F';
export const CONSENT_KEY = 'ex.analytics.v1';
const ORIGIN = 'https://electricistaxpress.com.ar';
const PUBLIC_PATHS = new Set(['/', '/registrarse', '/ingresar', '/recuperar', '/privacidad', '/condiciones', '/aviso-legal', '/seguridad', '/gestiones']);
const EVENTS = new Set(['trial_interest', 'select_plan', 'begin_checkout', 'trial_start', 'project_saved']);
export function createAnalytics(win, document, id = MEASUREMENT_ID) {
  let active = false, loaded = false, current = '/', lastPage = null;
  const eligible = () => win?.location?.hostname === 'electricistaxpress.com.ar' && /^G-[A-Z0-9]+$/.test(id);
  function send() { win.dataLayer ??= []; win.dataLayer.push(arguments); }
  const safePage = path => PUBLIC_PATHS.has(path) ? path : '/';
  const context = () => ({ page_location: ORIGIN + safePage(current), page_title: 'Electricista Xpress', page_referrer: '' });
  const clearCookies = () => {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', '; Domain=electricistaxpress.com.ar', '; Domain=.electricistaxpress.com.ar']) document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
    }
  };
  function consent() { try { const value = win.localStorage.getItem(CONSENT_KEY); return ['granted', 'denied'].includes(value) ? value : null; } catch { return null; } }
  function page(path) {
    current = path;
    if (!PUBLIC_PATHS.has(path)) { lastPage = null; return; }
    if (!active || lastPage === path) return;
    lastPage = path; send('event', 'page_view', context());
  }
  function apply(value, persist = true) {
    if (!['granted', 'denied'].includes(value)) return;
    if (persist) try { win.localStorage.setItem(CONSENT_KEY, value); } catch { /* Session-only preference. */ }
    active = value === 'granted' && eligible();
    win['ga-disable-' + id] = !active;
    lastPage = null;
    if (!active) {
      // Do not send denied-consent pings. Reload after revocation unloads the tag.
      clearCookies(); return;
    }
    if (!loaded) {
      loaded = true;
      send('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      send('js', new Date());
      send('config', id, { ...context(), send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 5184000 });
      const script = document.createElement('script'); script.async = true; script.referrerPolicy = 'no-referrer'; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.append(script);
    }
    page(current);
  }
  function event(name, params = {}) {
    if (!active || !EVENTS.has(name)) return;
    const safe = {};
    if (['presupuestos', 'croquis'].includes(params.plan)) safe.plan = params.plan;
    send('event', name, { ...context(), ...safe });
  }
  return { consent, apply, page, event, start(path) { current = path; const value = consent(); if (value) apply(value, false); } };
}
let singleton;
export const analytics = () => singleton ??= createAnalytics(window, document);
