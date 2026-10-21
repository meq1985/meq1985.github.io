// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/services/billing', () => ({ loadBillingAccess: vi.fn() }));
import { loadBillingAccess } from '../src/services/billing';
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
