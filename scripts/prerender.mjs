import { createServer } from 'vite';
import { readFile, writeFile, readdir } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await server.ssrLoadModule('/src/marketingRender.js');
  const { updateSeo, ...seo } = await server.ssrLoadModule('/src/services/seo.js');
  const template = await readFile('dist/index.html', 'utf8');
  const pages = [['/', null, seo.HOME_TITLE, seo.HOME_DESCRIPTION],
    ['/condiciones', 'conditions', 'Condiciones de uso | Electricista Xpress', 'Planes, prueba gratuita de 30 días, cancelación y acceso a tus proyectos.'],
    ['/privacidad', 'privacy', 'Privacidad | Electricista Xpress', 'Responsable, datos personales, proveedores y ejercicio de tus derechos.'],
    ['/aviso-legal', 'notice', 'Aviso legal | Electricista Xpress', 'Identidad del responsable, contacto y alcance del servicio.'],
    ['/seguridad', 'security', 'Seguridad y confianza | Electricista Xpress', 'Conexión HTTPS, protección de la cuenta y gestión de pagos.'],
    ['/gestiones', 'requests', 'Baja y arrepentimiento | Electricista Xpress', 'Solicitá la baja o el arrepentimiento sin iniciar sesión.']];
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  for (const [path, kind, title, description] of pages) {
    const url = seo.SITE_URL + path;
    let html = template.replace('<div id="app"></div>', `<div id="app">${await render(path, kind)}</div>`)
      .replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`);
    for (const name of ['description', 'og:description', 'twitter:description']) {
      html = html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*`), `$1${escape(description)}`);
    }
    for (const name of ['og:title', 'twitter:title']) html = html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*`), `$1${escape(title)}`);
    if (kind) html = html.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '');
    const css = (await readdir('dist/assets')).find(name => name.startsWith(kind ? 'LegalView-' : 'HomeView-') && name.endsWith('.css'));
    if (!css) throw new Error('Missing marketing styles');
    html = html.replace('</head>', `<link rel="stylesheet" href="/assets/${css}"></head>`);
    await writeFile(path === '/' ? 'dist/index.html' : `dist${path}.html`, html);
  }
  console.log('SEO: 6 public pages rendered with canonical metadata.');
} finally { await server.close(); }
