// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import LegalView from '../src/views/LegalView.vue';
import { HOME_TITLE, HOME_DESCRIPTION, HOME_SCHEMA, SITE_URL, updateSeo } from '../src/services/seo';
import NotFoundView from '../src/views/NotFoundView.vue';
afterEach(() => { document.head.innerHTML = ''; });
it('provides a useful not-found page with navigation and no indexable canonical', () => {
  const w = mount(NotFoundView);
  expect(w.get('h1').text()).toContain('ninguna página');
  expect(w.get('a[href="/"]').exists()).toBe(true);
  expect(w.get('a[href="/proyectos"]').exists()).toBe(true);
  updateSeo({ path: '/enlace-inexistente', name: 'not-found' });
  expect(document.title).toContain('Página no encontrada');
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex,follow');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  w.unmount();
});
it('keeps the home description concise and consistent before JavaScript runs', () => {
  const html = readFileSync(resolve('index.html'), 'utf8');
  expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
  expect(html.match(/<meta name="description" content="([^"]*)"/)[1]).toBe(HOME_DESCRIPTION);
});
it('uses clean canonical URLs for public pages and noindex for account routes', () => {
  updateSeo({ path: '/', query: { utm_source: 'demo' } });
  expect(document.title).toBe(HOME_TITLE);
  expect(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)).toEqual(HOME_SCHEMA);
  expect(document.querySelector('link[rel="canonical"]').href).toBe(SITE_URL + '/');
  updateSeo({ path: '/privacidad' });
  expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  expect(document.title).toContain('Privacidad');
  expect(document.querySelector('meta[property="og:url"]').content).toBe(SITE_URL + '/privacidad');
  updateSeo({ path: '/proyectos/private-id/editar' });
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex,follow');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.head.innerHTML).not.toContain('private-id');
  updateSeo({ path: '/' });
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  expect(document.querySelector('meta[name="robots"]').content).toBe('index,follow');
  expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
});
it('ships static social metadata, valid structured data and a public-only sitemap', () => {
  const html = readFileSync(resolve('index.html'), 'utf8');
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  expect(SITE_URL).toBe('https://electricistaxpress.com.ar');
  expect(data.url).toBe(SITE_URL + '/');
  expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/"`);
  expect(html).toContain(`<meta property="og:url" content="${SITE_URL}/"`);
  expect(data['@type']).toBe('SoftwareApplication');
  expect(data).toEqual(HOME_SCHEMA);
  expect(data).not.toHaveProperty('aggregateRating');
  expect(html).toContain('og:description');
  const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8');
  expect(sitemap.match(/<loc>/g)).toHaveLength(6);
  expect(sitemap.match(/<loc>(.*?)<\/loc>/g).every(url => url.startsWith('<loc>' + SITE_URL + '/'))).toBe(true);
  expect(readFileSync(resolve('public/robots.txt'), 'utf8')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  expect(sitemap).not.toMatch(/dashboard|proyectos|planes|registrarse/);
});
it.each(['conditions', 'privacy', 'notice', 'security', 'requests'])('offers a public %s page without requiring account data', kind => {
  const w = mount(LegalView, { props: { kind }, global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
  expect(w.findAll('h1')).toHaveLength(1);
  expect(w.text()).toContain('meq1985@hotmail.com');
  if (kind === 'conditions') expect(w.text()).toContain('Cancelar la renovación no elimina tus proyectos');
  w.unmount();
});
