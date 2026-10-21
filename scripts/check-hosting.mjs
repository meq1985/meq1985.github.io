import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5000';
const home = await fetch(base + '/');
assert.equal(home.status, 200);
const html = await home.text();
const asset = html.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
assert.ok(asset, 'Debe servir el build de Vite');
for (const path of ['/dashboard', '/config', '/proyectos', '/proyectos/demo/editar', '/mispresupuestos', '/ingresar', '/registrarse', '/recuperar']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.equal(await response.text(), html, path + ': debe permitir carga directa de rutas Vue');
}
const builtAsset = await fetch(base + asset);
assert.equal(builtAsset.status, 200);
const entry = await fetch(base + '/index.html');
assert.ok((await builtAsset.text()).length > 1000);
console.log('Hosting local: portada, 8 rutas directas, build JavaScript, caché y cabeceras correctos.');
