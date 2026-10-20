// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/stores/dbUsers', () => ({ PostStore: () => ({ obtenerDato: vi.fn(), updateItem: vi.fn(), nombre1: 'Demo' }) }));
vi.mock('../src/services/catalogPersistence', () => ({ loadCatalog: vi.fn(), loadSuggestedCatalog: vi.fn(), saveCatalogPrices: vi.fn() }));
vi.mock('../src/firebase/session', () => ({ requireUser: vi.fn(async () => ({ uid: 'demo', email: 'demo@example.invalid' })) }));
vi.mock('../src/services/localBudgets', () => ({ saveBudget: vi.fn() }));
vi.mock('../src/services/budgetPdf', () => ({ buildBudgetPdf: vi.fn(async () => ({ output: () => new Blob(['pdf']), save: vi.fn() })) }));
import { loadCatalog, loadSuggestedCatalog, saveCatalogPrices } from '../src/services/catalogPersistence';
import { saveBudget } from '../src/services/localBudgets';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import Config from '../src/views/ConfigView.vue';
import Dashboard from '../src/views/DashboardView.vue';
const entries = [
  { id: 'visita', category: 'general', code: 'A26-001', description: 'Visita', unit: 'visita', price: 56393 },
  { id: 'losa_metal', category: 'canalizacion', code: 'A26-008', description: 'Losa', unit: 'boca', price: 57000 },
];
beforeEach(() => { vi.clearAllMocks(); loadCatalog.mockResolvedValue(structuredClone(entries)); saveCatalogPrices.mockResolvedValue(); });
const button = (wrapper, text) => wrapper.findAll('button').find(item => item.text().startsWith(text));

it('reviews a 20% increase before saving exactly once and displays persistence failures', async () => {
  const wrapper = mount(Config); await flushPromises();
  await button(wrapper, 'Revisar ajuste').trigger('click');
  expect(wrapper.text()).toContain('Aumentar 20 %');
  expect(saveCatalogPrices).not.toHaveBeenCalled();
  await button(wrapper, 'Aplicar y guardar').trigger('click'); await flushPromises();
  expect(saveCatalogPrices).toHaveBeenCalledExactlyOnceWith({ visita: 67671.6, losa_metal: 68400 }, { visita: 56393, losa_metal: 57000 });
  expect(wrapper.text()).toContain('Actualización guardada');
  saveCatalogPrices.mockRejectedValue(new Error('Los precios cambiaron en otra pestaña.'));
  await button(wrapper, 'Revisar ajuste').trigger('click');
  await button(wrapper, 'Aplicar y guardar').trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('otra pestaña');
  wrapper.unmount();
});

it('scopes decreases, cancels previews and blocks bulk edits while individual prices are unsaved', async () => {
  const wrapper = mount(Config); await flushPromises();
  const selects = wrapper.findAll('select');
  await selects[0].setValue('canalizacion'); await selects[1].setValue('decrease');
  await button(wrapper, 'Revisar ajuste').trigger('click');
  await button(wrapper, 'Aplicar y guardar').trigger('click'); await flushPromises();
  expect(saveCatalogPrices).toHaveBeenLastCalledWith({ losa_metal: 45600 }, { visita: 56393, losa_metal: 57000 });
  await button(wrapper, 'Revisar ajuste').trigger('click');
  await wrapper.get('#price-visita').setValue(100);
  expect(wrapper.find('.catalog-preview').exists()).toBe(false);
  expect(button(wrapper, 'Revisar ajuste').attributes('disabled')).toBeDefined();
  await button(wrapper, 'Descartar cambios').trigger('click');
  expect(wrapper.get('#price-visita').element.value).toBe('56393');
  wrapper.unmount();
});

it('uses account prices, allows repeating an item and saves unit and price snapshots', async () => {
  const wrapper = mount(Dashboard); await flushPromises();
  await wrapper.get('#budget-client').setValue('Cliente Demo');
  await wrapper.get('#budget-property-type').setValue('Vivienda unifamiliar');
  await wrapper.get('select').setValue('losa_metal');
  await button(wrapper, 'Agregar ítem').trigger('click');
  await button(wrapper, 'Agregar ítem').trigger('click');
  expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  await wrapper.get('[aria-label="Cantidad del ítem 1"]').setValue(2);
  await button(wrapper, 'Guardar presupuesto').trigger('click'); await flushPromises();
  expect(saveBudget).toHaveBeenCalledOnce();
  expect(buildBudgetPdf.mock.calls.at(-1)[1].correo).toBe('demo@example.invalid');
  expect(buildBudgetPdf.mock.calls.at(-1)[0].createdAt).toMatch(/^\d{4}-/);
  const [owner, budget] = saveBudget.mock.calls[0];
  expect(owner).toBe('demo');
  expect(budget.total).toBe(171000);
  expect(budget.tipoInmueble).toBe('Vivienda unifamiliar');
  expect(buildBudgetPdf.mock.calls.at(-1)[0].tipoInmueble).toBe('Vivienda unifamiliar');
  expect(budget.items[0]).toMatchObject({ unidad: 'boca', cantidad: 2, precioUnitario: 57000 });
  wrapper.unmount();
});

it('fetches the current monthly suggestion only on request and saves only after confirmation', async () => {
  const { LABOR_CATALOG } = await import('../src/data/laborCatalog');
  const suggested = { version: '2026-11-v1', label: 'Noviembre 2026', prices: Object.fromEntries(LABOR_CATALOG.map(item => [item.id, 100])) };
  loadSuggestedCatalog.mockResolvedValue(suggested);
  const wrapper = mount(Config); await flushPromises();
  expect(loadSuggestedCatalog).not.toHaveBeenCalled();
  await button(wrapper, 'Consultar precios sugeridos').trigger('click'); await flushPromises();
  expect(wrapper.text()).toContain('Noviembre 2026');
  expect(saveCatalogPrices).not.toHaveBeenCalled();
  await button(wrapper, 'Cancelar').trigger('click');
  expect(saveCatalogPrices).not.toHaveBeenCalled();
  await button(wrapper, 'Consultar precios sugeridos').trigger('click'); await flushPromises();
  await button(wrapper, 'Aplicar y guardar').trigger('click'); await flushPromises();
  expect(saveCatalogPrices).toHaveBeenCalledExactlyOnceWith(suggested.prices, { visita: 56393, losa_metal: 57000 }, suggested);
  wrapper.unmount();
});

it('leaves prices untouched when the monthly catalog cannot be loaded', async () => {
  loadSuggestedCatalog.mockRejectedValue(new Error('Catálogo no disponible'));
  const wrapper = mount(Config); await flushPromises();
  await button(wrapper, 'Consultar precios sugeridos').trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('no disponible');
  expect(wrapper.find('.catalog-preview').exists()).toBe(false);
  expect(saveCatalogPrices).not.toHaveBeenCalled();
  expect(wrapper.get('#price-visita').element.value).toBe('56393');
  wrapper.unmount();
});



it('allows saving a profile without a company while keeping other professional fields required', async () => {
  const wrapper = mount(Config); await flushPromises();
  expect(wrapper.get('input[name="empresa"]').attributes('required')).toBeUndefined();
  expect(wrapper.get('input[name="nombre"]').attributes('required')).toBeDefined();
  wrapper.unmount();
});
