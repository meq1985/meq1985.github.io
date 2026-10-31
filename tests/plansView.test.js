// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<header>Electricista Xpress</header>' } }));
vi.mock('../src/services/billing', () => ({ loadBillingAccess: vi.fn(), startSubscription: vi.fn(), refreshSubscription: vi.fn(), cancelSubscription: vi.fn() }));
import { loadBillingAccess, startSubscription, refreshSubscription, cancelSubscription } from '../src/services/billing';
import Plans from '../src/views/PlansView.vue';
const base = { enabled: true, admin: false, checkoutAvailable: true, trialStartedAt: Date.now(), subscription: null };
const subscription = patch => ({ planId: 'presupuestos', status: 'active', manageable: true, providerStatus: 'authorized', paidThrough: Date.now() + 86400000, ...patch });
const render = () => mount(Plans, { global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } });
const button = (wrapper, text) => wrapper.findAll('button').find(b => b.text().includes(text));
beforeEach(() => { vi.resetAllMocks(); window.history.replaceState({}, '', '/planes'); loadBillingAccess.mockResolvedValue({ ...base }); refreshSubscription.mockResolvedValue({ status: 'inactive' }); cancelSubscription.mockResolvedValue({}); });

it('compares the free project and both plans with finished-product copy while retaining checkout gates', async () => {
  const w = render(); await flushPromises();
  expect(w.findAll('.plan-card')).toHaveLength(3);
  expect(w.text()).toContain('$0'); expect(w.text()).toContain('12.000'); expect(w.text()).toContain('25.000');
  expect(button(w, 'Elegir Full').element.disabled).toBe(true);
  expect(w.findAll('[data-testid="renewal-consent"]')).toHaveLength(2);
  expect(w.findAll('.plan-card')[1].text()).toContain('Básico · Presupuestos');
  const full = w.findAll('.plan-card')[2];
  expect(full.text()).toContain('Full · Presupuestos + croquis');
  expect(full.text()).toContain('Medidor, tableros y jabalinas');
  expect(w.text()).not.toMatch(/próximamente|en pruebas|en desarrollo|en preparación/i);
  expect(full.text()).not.toContain('calcular presupuestos y materiales');
  expect(w.text()).toContain('Tu prueba gratuita está activa'); expect(w.text()).toContain('Disponible hasta'); w.unmount();
});
it('requires renewal consent and prevents blind repeated checkouts after failure', async () => {
  startSubscription.mockRejectedValue(new Error('private provider error'));
  const w = render(); await flushPromises();
  expect(button(w, 'Elegir Presupuestos').element.disabled).toBe(true);
  await w.findAll('[data-testid="renewal-consent"]')[0].setValue(true);
  await button(w, 'Elegir Presupuestos').trigger('click'); await flushPromises();
  expect(startSubscription).toHaveBeenCalledExactlyOnceWith('presupuestos'); expect(w.text()).not.toContain('private provider error');
  expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false);
  await button(w, 'Actualizar estado del pago').trigger('click'); await flushPromises();
  expect(refreshSubscription).toHaveBeenCalledTimes(1); w.unmount();
});
it('does not expose checkout when commercial activation is disabled or account loading fails', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, enabled: false, checkoutAvailable: false });
  const w = render(); await flushPromises(); expect(w.text()).toContain('Tu prueba gratuita está activa'); expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false); w.unmount();
  loadBillingAccess.mockRejectedValue(new Error('private failure'));
  const failed = render(); await flushPromises(); expect(failed.get('[role="alert"]').text()).toContain('conexión');
  expect(failed.find('[data-testid="renewal-consent"]').exists()).toBe(false); expect(startSubscription).not.toHaveBeenCalled(); failed.unmount();
});
it('gives administrators full access without offering purchases or cancellation', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, admin: true, checkoutAvailable: false, subscription: subscription() });
  const w = render(); await flushPromises(); expect(w.text()).toContain('Acceso administrador');
  expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false); expect(w.find('.management').exists()).toBe(false); w.unmount();
});
it('shows a paid cancelled plan until expiry without offering overlapping purchases', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({ providerStatus: 'cancelled' }) });
  const w = render(); await flushPromises(); expect(w.text()).toContain('renovación cancelada');
  expect(button(w, 'Tu plan actual').element.disabled).toBe(true); expect(w.find('[data-testid="cancel-consent"]').exists()).toBe(false);
  expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false); w.unmount();
});
it('allows an expired cancelled plan to subscribe again and resumes a pending checkout', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({ providerStatus: 'cancelled', paidThrough: 1 }) });
  const w = render(); await flushPromises(); expect(button(w, 'Elegir Presupuestos')).toBeTruthy(); w.unmount();
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({ providerStatus: 'pending', status: 'inactive', paidThrough: 0 }) });
  const pending = render(); await flushPromises(); expect(button(pending, 'Retomar en Mercado Pago')).toBeTruthy(); pending.unmount();
});
it('requires confirmation to cancel and refreshes the authoritative account afterwards', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription() });
  const w = render(); await flushPromises(); expect(button(w, 'Cancelar renovación').element.disabled).toBe(true);
  await w.get('[data-testid="cancel-consent"]').setValue(true);
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({ providerStatus: 'cancelled' }) });
  await button(w, 'Cancelar renovación').trigger('click'); await flushPromises();
  expect(cancelSubscription).toHaveBeenCalledTimes(1); expect(w.text()).toContain('Renovación cancelada. Conservás'); w.unmount();
});
it('queries the server once on checkout return and never trusts forged approved query parameters', async () => {
  window.history.replaceState({}, '', '/planes?preapproval_id=forged&status=approved');
  const w = render(); await flushPromises();
  expect(refreshSubscription).toHaveBeenCalledExactlyOnceWith(); expect(loadBillingAccess).toHaveBeenCalledTimes(2);
  expect(w.text()).not.toContain('Plan Presupuestos activo'); expect(w.text()).not.toContain('Pago confirmado.'); w.unmount();
});

it('shows an expired trial without losing access to project consultation', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, trialStartedAt: Date.now() - 31 * 86400000, checkoutAvailable: false });
  const w = render(); await flushPromises();
  expect(w.text()).toContain('Tu prueba gratuita terminó');
  expect(w.text()).toContain('consultar tus proyectos');
  expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false); w.unmount();
});

it('contracts Full only after its own price and renewal consent', async () => {
  startSubscription.mockRejectedValue(new Error('stop navigation'));
  const w = render(); await flushPromises();
  const full = w.findAll('.plan-card')[2];
  expect(full.text()).toContain('25.000');
  await full.get('input[type="checkbox"]').setValue(true);
  expect(button(w, 'Elegir Presupuestos').element.disabled).toBe(true);
  await button(w, 'Elegir Full').trigger('click'); await flushPromises();
  expect(startSubscription).toHaveBeenCalledExactlyOnceWith('croquis'); w.unmount();
});
it('recognizes paid Full and never offers a different plan for a pending checkout', async () => {
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({planId: 'croquis'}) });
  const w = render(); await flushPromises();
  expect(w.text()).toContain('Plan Full activo');
  expect(w.find('[data-testid="renewal-consent"]').exists()).toBe(false); w.unmount();
  loadBillingAccess.mockResolvedValue({ ...base, subscription: subscription({status: 'inactive', paidThrough: 0, providerStatus: 'pending', pendingPlanId: 'croquis'}) });
  const pending = render(); await flushPromises();
  expect(pending.findAll('[data-testid="renewal-consent"]')).toHaveLength(1);
  expect(pending.findAll('.plan-card')[2].text()).toContain('Retomar en Mercado Pago'); pending.unmount();
});
