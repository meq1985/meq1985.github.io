import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Run with Firebase Hosting emulator, never against an authenticated production app.
const origin = 'http://127.0.0.1:5000';
const applicationHtml = await readFile('dist/index.html', 'utf8');
const accountPaths = new Set(['/dashboard', '/config', '/proyectos', '/proyectos/test-project/editar', '/mispresupuestos', '/ingresar', '/registrarse', '/recuperar', '/planes']);
const cases = [
  ...['/', '/aviso-legal', '/privacidad', '/condiciones', '/seguridad', '/gestiones',
    '/ingresar', '/registrarse', '/recuperar', '/planes', '/proyectos', '/config',
    '/dashboard', '/mispresupuestos', '/proyectos/test-project/editar'].map(path => [path, 200]),
  ...['/__pagina_inexistente', '/proyectos/test-project/otra', '/assets/inexistente.js'].map(path => [path, 404]),
];
for (const [path, expected] of cases) {
  const response = await fetch(origin + path);
  assert.equal(response.status, expected, path);
  if (accountPaths.has(path)) assert.equal(await response.text(), applicationHtml, `${path}: direct Vue route`);
  if (expected === 404) {
    const html = await response.text();
    assert.match(html, /404 · PÁGINA NO ENCONTRADA/);
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.doesNotMatch(html, /rel="canonical"|type="module"|application\/ld\+json/);
    const stylesheet = html.match(/href="(\/assets\/NotFoundView-[^"]+\.css)"/)[1];
    const css = await (await fetch(origin + stylesheet)).text();
    for (const id of new Set(html.match(/data-v-[a-z0-9]+/g))) {
      assert.ok(css.includes(id), `Prerendered CSS scope must match ${id}`);
    }
  }
}
const html = await (await fetch(origin)).text();
const entry = html.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
assert.ok(entry, 'Production entry script');
const builtEntry = await fetch(origin + entry);
assert.equal(builtEntry.status, 200);
assert.ok((await builtEntry.text()).length > 1000);
assert.equal((await fetch(origin + '/index.html')).status, 200);
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
const home = manifest['src/views/HomeView.vue'];
assert.ok(html.includes(`rel="modulepreload" crossorigin href="/${home.file}"`));
assert.equal((await fetch(origin + '/' + home.file)).status, 200);
assert.equal(html.match(/<meta name="description" content="([^"]*)"/)[1].length, 155);
console.log(`Hosting: ${cases.length} routes, real 404 responses and home module preload verified.`);
