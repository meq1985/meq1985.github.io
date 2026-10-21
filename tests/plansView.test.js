// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/services/billing', () => ({ loadBillingAccess: vi.fn(), startSubscription: vi.fn(), refreshSubscription: vi.fn(), cancelSubscription: vi.fn() }));
import { loadBillingAccess, startSubscription, refreshSubscription, cancelSubscription } from '../src/services/billing';
import Plans from '../src/views/PlansView.vue';
beforeEach(() => vi.clearAllMocks());
const render = () => mount(Plans, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
it('clearly offers one project without an automatic charge and keeps checkout unavailable', async () => {
  loadBillingAccess.mockResolvedValue({ enabled: true, freeProjectId: 'first' });
  const wrapper = render(); await flushPromises();
  expect(wrapper.text()).toContain('sin vencimiento'); expect(wrapper.text()).toContain('12.000'); expect(wrapper.text()).toContain('25.000');
  expect(wrapper.text()).toContain('no se convierte automáticamente');
  expect(wrapper.findAll('button').every(button => button.attributes('disabled') !== undefined)).toBe(true);
  expect(wrapper.text()).toContain('Abrir mi proyecto gratuito'); wrapper.unmount();
});
it('shows administrator access without offering a payment', async () => {
  loadBillingAccess.mockResolvedValue({ enabled: true, admin: true });
  const wrapper = render(); await flushPromises(); expect(wrapper.text()).toContain('acceso completo sin suscripción'); wrapper.unmount();
});
it('reports status errors instead of assuming an account is subscribed', async () => {
  loadBillingAccess.mockRejectedValue(new Error('Sin conexión'));
  const wrapper = render(); await flushPromises(); expect(wrapper.get('[role="alert"]').text()).toContain('Sin conexión'); wrapper.unmount();
});
it('requires explicit monthly renewal consent before starting checkout and handles failure', async () => {
  loadBillingAccess.mockResolvedValue({ enabled: true, checkoutAvailable: true });
  startSubscription.mockRejectedValue(new Error('Provider unavailable'));
  const wrapper = render(); await flushPromises();
  const button = wrapper.findAll('button').find(button => button.text() === 'Continuar a Mercado Pago');
  expect(button.attributes('disabled')).toBeDefined();
  await wrapper.get('input[type="checkbox"]').setValue(true);
  await button.trigger('click'); await flushPromises();
  expect(startSubscription).toHaveBeenCalledTimes(1);
  expect(wrapper.get('[role="alert"]').text()).toContain('Consultá el estado');
  wrapper.unmount();
});
it('cancels renewal only after explicit confirmation and refreshes server state', async () => {
  loadBillingAccess.mockResolvedValue({ enabled: true, subscription: { manageable: true, providerStatus: 'authorized', status: 'active', paidThrough: Date.now() + 86400000 } });
  const wrapper = render(); await flushPromises();
  const button = wrapper.findAll('button').find(button => button.text() === 'Cancelar renovación');
  expect(button.attributes('disabled')).toBeDefined();
  await wrapper.get('input[type="checkbox"]').setValue(true); await button.trigger('click'); await flushPromises();
  expect(cancelSubscription).toHaveBeenCalledTimes(1); expect(wrapper.text()).toContain('Renovación cancelada');
  await wrapper.findAll('button').find(button => button.text() === 'Actualizar estado del pago').trigger('click'); await flushPromises();
  expect(refreshSubscription).toHaveBeenCalledTimes(1);
  wrapper.unmount();
});
