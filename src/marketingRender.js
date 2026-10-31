import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Home from './views/HomeView.vue';
import Legal from './views/LegalView.vue';
import NotFound from './views/NotFoundView.vue';
export async function render(path, kind) {
  const component = kind === 'not-found' ? NotFound : kind ? { render: () => h(Legal, { kind }) } : Home;
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component }] });
  const app = createSSRApp(component); app.use(createPinia()); app.use(router);
  await router.push(path); await router.isReady();
  return renderToString(app);
}
