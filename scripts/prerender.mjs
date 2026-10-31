import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { render } = await server.ssrLoadModule('/src/marketingRender.js');
  const { updateSeo, ...seo } = await server.ssrLoadModule('/src/services/seo.js');
  const template = await readFile('dist/index.html', 'utf8');
  const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
  const pages = [['/', null, seo.HOME_TITLE, seo.HOME_DESCRIPTION],
    ['/condiciones', 'conditions', 'Condiciones de uso | Electricista Xpress', 'Planes, prueba gratuita de 30 días, cancelación y acceso a tus proyectos.'],
    ['/privacidad', 'privacy', 'Privacidad | Electricista Xpress', 'Responsable, datos personales, proveedores y ejercicio de tus derechos.'],
    ['/aviso-legal', 'notice', 'Aviso legal | Electricista Xpress', 'Identidad del responsable, contacto y alcance del servicio.'],
    ['/seguridad', 'security', 'Seguridad y confianza | Electricista Xpress', 'Conexión HTTPS, protección de la cuenta y gestión de pagos.'],
    ['/gestiones', 'requests', 'Baja y arrepentimiento | Electricista Xpress', 'Solicitá la baja o el arrepentimiento sin iniciar sesión.'],
    ['/404', 'not-found', 'Página no encontrada | Electricista Xpress', 'El enlace no existe. Volvé al inicio o ingresá a tus proyectos.']];
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
    const component = kind === 'not-found' ? 'NotFoundView' : kind ? 'LegalView' : 'HomeView';
    const chunk = manifest[`src/views/${component}.vue`];
    if (!chunk?.file || !chunk.css?.length) throw new Error('Missing public page assets');
    const links = chunk.css.map(css => `<link rel="stylesheet" href="/${css}">`).join('');
    html = html.replace('</head>', `${links}</head>`);
    if (kind === 'not-found') {
      // Unknown URLs must work without booting Auth or the application bundle.
      html = html.replace(/<link rel="canonical"[^>]*>/g, '')
        .replace(/(<meta name="robots" content=")[^"]*/, '$1noindex,follow')
        .replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g, '')
        .replace(/<link rel="modulepreload"[^>]*>/g, '')
        .replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    } else {
      // Route chunks are otherwise discovered only after the router initializes.
      html = html.replace('</head>', `<link rel="modulepreload" crossorigin href="/${chunk.file}"></head>`);
    }
    await writeFile(path === '/' ? 'dist/index.html' : `dist${path}.html`, html);
  }
  console.log('SEO: 6 public pages and a static noindex 404 rendered.');
} finally { await server.close(); }
