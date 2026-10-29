// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from '../src/views/HomeView.vue';
import AuthView from '../src/views/AuthView.vue';
import { createAuthGuard } from '../src/router/guard';
vi.mock('../src/components/BotCheck.vue', () => ({ default: { emits: ['verified'], template: `<button type="button" data-testid="challenge" @click="$emit('verified', 'test-challenge')">Verificar</button>` } }));
const state = vi.hoisted(() => ({ store: null }));
vi.mock('../src/stores/user', () => ({ useUserStore: () => state.store }));
beforeEach(() => { state.store = reactive({ user: null, busy: false, error: '', notice: '', login: vi.fn(), register: vi.fn(), resetPassword: vi.fn() }); });
async function page(path = '/') {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: HomeView },
    ...[['/ingresar', 'login'], ['/registrarse', 'register'], ['/recuperar', 'recovery']].map(([path, authMode]) => ({ path, component: AuthView, meta: { authMode } })),
    { path: '/config', component: { template: '<div>Cuenta</div>' } },
    { path: '/dashboard', component: { template: '<div>Presupuestar</div>' } },
  ] });
  await router.push(path); await router.isReady();
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } });
  return { wrapper, router };
}
describe('professional landing and access', () => {
  it('presents finished-product copy with manual budgets first and the sketch second', async () => {
    const { wrapper } = await page();
    expect(wrapper.get('h1').text()).toContain('Presupuestos eléctricos');
    expect(wrapper.findAll('.home-plan')).toHaveLength(3);
    expect(wrapper.get('#planes').text()).toContain('12.000');
    expect(wrapper.get('#planes').text()).toContain('25.000');
    expect(wrapper.text()).not.toMatch(/próximamente|en pruebas|en desarrollo|precio previsto|en preparación/i);
    expect(wrapper.get('.actions a').text()).toContain('Empezar mi mes gratis');
    expect(wrapper.get('.lead').text()).toContain('desde el celular o la computadora');
    expect(wrapper.get('a[download]').attributes('href')).toBe('/ejemplo-presupuesto-electrico.pdf');
    expect(wrapper.get('a[download]').text()).toBe('Descargar PDF de ejemplo');
    expect(wrapper.find('#demostracion').exists()).toBe(false);
    expect(wrapper.text()).not.toMatch(/demostración|reproducir/i);
    expect(wrapper.findAll('section[id]').map(section => section.attributes('id')).slice(0, 2)).toEqual(['croquis', 'herramientas']);
    expect(wrapper.get('#croquis').text()).toContain('borrador de mano de obra');
    expect(wrapper.get('#croquis svg').attributes('aria-label')).toContain('tablero general');
    expect(wrapper.get('.home-plan-full').text()).toContain('Recorridos medidos');
    expect(wrapper.find('.home-plan-full a').attributes('href')).toBe('/ingresar');
    wrapper.unmount();
  });
  it('offers working signup navigation and clearly explains account storage and illustrative prices', async () => {
    const { wrapper, router } = await page();
    expect(wrapper.findAll('h1')).toHaveLength(1);
    expect(wrapper.text()).toContain('Valores ilustrativos');
    expect(wrapper.text()).toContain('Los proyectos se guardan en tu cuenta');
    for (const link of wrapper.findAll('a[href^="#"]')) expect(wrapper.find(link.attributes('href')).exists()).toBe(true);
    await wrapper.find('a[href="/registrarse"]').trigger('click'); await flushPromises();
    expect(router.currentRoute.value.path).toBe('/registrarse');
    expect(wrapper.find('input[autocomplete="new-password"]').exists()).toBe(true);
    wrapper.unmount();
  });
  it('shows application links for a verified user', async () => {
    state.store.user = { emailVerified: true };
    const { wrapper } = await page();
    expect(wrapper.find('a[href="/dashboard"]').exists()).toBe(true);
    expect(wrapper.find('a[href="/registrarse"]').exists()).toBe(false);
    wrapper.unmount();
  });
  it.each([['/ingresar', 'login'], ['/registrarse', 'register'], ['/recuperar', 'resetPassword']])('submits %s to the existing auth action', async (path, action) => {
    const { wrapper } = await page(path);
    await wrapper.get('#auth-email').setValue('demo@example.com');
    if (action !== 'resetPassword') await wrapper.get('#auth-password').setValue('password123');
    else expect(wrapper.find('input[type="password"]').exists()).toBe(false);
    if (action === 'register') { await wrapper.get('[data-testid="legal-consent"]').setValue(true); await wrapper.get('[data-testid="challenge"]').trigger('click'); }
    await wrapper.get('form').trigger('submit');
    expect(state.store[action]).toHaveBeenCalledWith(...(action === 'resetPassword' ? ['demo@example.com'] : action === 'register' ? ['demo@example.com', 'password123', 'test-challenge'] : ['demo@example.com', 'password123']));
    wrapper.unmount();
  });
  it('prevents duplicate submissions and exposes accessible feedback', async () => {
    const { wrapper } = await page('/ingresar');
    state.store.busy = true; state.store.error = 'Reintentá'; state.store.notice = 'Revisá tu correo';
    await flushPromises(); await wrapper.get('form').trigger('submit');
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
    expect(state.store.login).not.toHaveBeenCalled();
    expect(wrapper.get('[role="alert"]').text()).toBe('Reintentá');
    expect(wrapper.get('[role="status"]').text()).toBe('Revisá tu correo');
    wrapper.unmount();
  });
  it('clears passwords when switching access screens and preserves the email', async () => {
    const { wrapper, router } = await page('/ingresar');
    await wrapper.get('#auth-email').setValue('demo@example.com');
    await wrapper.get('#auth-password').setValue('secret123');
    await router.push('/registrarse'); await flushPromises();
    expect(wrapper.get('#auth-password').element.value).toBe('');
    expect(wrapper.get('#auth-email').element.value).toBe('demo@example.com');
    wrapper.unmount();
  });
  it('redirects verified users from access screens only after provisioning succeeds', async () => {
    const route = { path: '/ingresar', matched: [{ meta: { authMode: 'login' } }] };
    const auth = { currentUser: { emailVerified: true } };
    expect(await createAuthGuard(auth, async () => {})(route)).toBe('/config');
    expect(await createAuthGuard(auth, async () => {}, async () => { throw Error('offline'); })(route)).toEqual({ path: '/', query: { setup: 'pending' } });
  });
});

it('requires legal acceptance to register and clears it on mode changes', async () => {
  const { wrapper, router } = await page('/registrarse');
  await wrapper.get('form').trigger('submit'); expect(state.store.register).not.toHaveBeenCalled();
  await wrapper.get('[data-testid="legal-consent"]').setValue(true);
  await wrapper.get('[data-testid="challenge"]').trigger('click');
  await wrapper.get('form').trigger('submit'); expect(state.store.register).toHaveBeenCalledOnce();
  await router.push('/ingresar'); await router.push('/registrarse'); await flushPromises();
  expect(wrapper.get('[data-testid="legal-consent"]').element.checked).toBe(false); wrapper.unmount();
});
