// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from '../src/views/HomeView.vue';
import AuthView from '../src/views/AuthView.vue';
import { createAuthGuard } from '../src/router/guard';
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
    await wrapper.get('form').trigger('submit');
    expect(state.store[action]).toHaveBeenCalledWith(...(action === 'resetPassword' ? ['demo@example.com'] : ['demo@example.com', 'password123']));
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
