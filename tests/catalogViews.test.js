// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/stores/dbUsers', () => ({ PostStore: () => ({ obtenerDato: vi.fn(), updateItem: vi.fn(), nombre1: 'Demo' }) }));
vi.mock('../src/services/catalogPersistence', () => ({ loadCatalog: vi.fn(), loadSuggestedCatalog: vi.fn(), saveCatalogPrices: vi.fn() }));
vi.mock('../src/firebase/session', () => ({ requireUser: vi.fn(async () => ({ uid: 'demo', email: 'demo@example.invalid' })), assertCurrentUser: vi.fn() }));
vi.mock('../src/services/billing', () => ({ loadBillingAccess: vi.fn(async () => ({ enabled: false, admin: true })) }));
vi.mock('../src/services/projects', () => ({ newProjectId: () => 'project-demo', loadProject: vi.fn(), saveProject: vi.fn() }));
vi.mock('../src/services/budgetPdf', () => ({ buildBudgetPdf: vi.fn(async () => ({ output: () => new Blob(['pdf']), save: vi.fn() })) }));
import { loadCatalog, loadSuggestedCatalog, saveCatalogPrices } from '../src/services/catalogPersistence';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import Config from '../src/views/ConfigView.vue';
import Dashboard from '../src/views/DashboardView.vue';
config.global.stubs.RouterLink = { template: '<a><slot /></a>' };
const entries = [
  { id: 'visita', category: 'general', code: 'A26-001', description: 'Visita', unit: 'visita', price: 56393 },
  { id: 'losa_metal', category: 'canalizacion', code: 'A26-008', description: 'Losa', unit: 'boca', price: 57000 },
];
beforeEach(async () => { vi.clearAllMocks(); const { loadBillingAccess } = await import('../src/services/billing'); loadBillingAccess.mockResolvedValue({ enabled: false, admin: true }); loadCatalog.mockResolvedValue(structuredClone(entries)); saveCatalogPrices.mockResolvedValue(); });
const button = (wrapper, text) => wrapper.findAll('button').find(item => item.text().startsWith(text));

it('places individual work inside the detail and varies quantity steps by unit', async () => {
  const wrapper = mount(Dashboard); await flushPromises();
  const section = wrapper.get('#budget-catalog-item').element.closest('section');
  expect(section.querySelector('h2').textContent).toBe('Detalle del presupuesto');
  await button(wrapper, 'Agregar ítem personalizado').trigger('click');
  const quantity = wrapper.get('[aria-label="Cantidad del ítem 1"]'); expect(quantity.attributes('step')).toBe('1');
  await wrapper.get('[aria-label="Unidad del ítem 1"]').setValue('m²'); expect(quantity.attributes('step')).toBe('0.1');
  wrapper.unmount();
});

it('turns drawing points into editable budget rows and saves account prices with the drawing', async () => {
  const { LABOR_CATALOG } = await import('../src/data/laborCatalog');
  const { saveProject } = await import('../src/services/projects');
  loadCatalog.mockResolvedValueOnce(LABOR_CATALOG.map(item => ({ ...item, price: item.id === 'boca_completa' ? 100 : item.id === 'proyecto_m2' ? 10 : item.price })));
  saveProject.mockResolvedValueOnce({ id: 'project-demo', revision: 1 });
  const wrapper = mount(Dashboard); await flushPromises();
  await wrapper.get('#budget-client').setValue('Cliente de obra nueva');
  await button(wrapper, '+ Ambiente').trigger('click');
  await button(wrapper, 'Luminaria').trigger('click'); await button(wrapper, 'Agregar al centro').trigger('click');
  await button(wrapper, 'Llave').trigger('click'); await button(wrapper, 'Agregar al centro').trigger('click');
  await button(wrapper, 'Revisar presupuesto del croquis').trigger('click');
  await button(wrapper, 'Usar este borrador').trigger('click');
  expect(wrapper.findAll('.catalog-budget tbody tr')).toHaveLength(2);
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  const saved = saveProject.mock.calls.at(-1)[0];
  expect(saved.budget.items).toMatchObject([{ cantidad: 1, precioUnitario: 100 }, { cantidad: 30, precioUnitario: 10 }]);
  expect(saved.budget.total).toBe(400); expect(saved.sketch.rooms[0].points).toHaveLength(2);
  wrapper.unmount();
});

it('restores and saves the account drawing as part of the same project version', async () => {
  const { loadProject, saveProject } = await import('../src/services/projects');
  const { emptySketch } = await import('../src/services/sketch');
  const drawing = emptySketch();
  loadProject.mockResolvedValueOnce({ id: 'existing', revision: 2, name: 'Proyecto', version: { sketch: drawing, profile: { nombre1: 'Demo' }, budget: { cliente: 'Cliente', items: [{ codigo: '1', descripcion: 'Trabajo', cantidad: 1, precioUnitario: 10 }] } } });
  saveProject.mockResolvedValueOnce({ id: 'existing', revision: 3 });
  const wrapper = mount(Dashboard, { props: { projectId: 'existing' } }); await flushPromises();
  expect(wrapper.text()).not.toContain('Se usan los precios guardados en tu cuenta');
  await button(wrapper, '+ Ambiente').trigger('click');
  expect(wrapper.text()).toContain('Tenés cambios sin guardar');
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  expect(saveProject.mock.calls.at(-1)[0]).toMatchObject({ id: 'existing', expectedRevision: 2, sketch: { rooms: [{ name: 'Ambiente 1' }] } });
  expect(wrapper.text()).toContain('Versión 3');
  expect(wrapper.text()).not.toContain('Tenés cambios sin guardar');
  wrapper.unmount();
});

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
  await wrapper.get('#budget-catalog-item').setValue('losa_metal');
  await button(wrapper, 'Agregar ítem').trigger('click');
  await button(wrapper, 'Agregar ítem').trigger('click');
  expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  await wrapper.get('[aria-label="Cantidad del ítem 1"]').setValue(2);
  await button(wrapper, 'Descargar PDF').trigger('click'); await flushPromises();
  expect(buildBudgetPdf.mock.calls.at(-1)[1].correo).toBe('demo@example.invalid');
  expect(buildBudgetPdf.mock.calls.at(-1)[0].createdAt).toMatch(/^\d{4}-/);
  const budget = buildBudgetPdf.mock.calls.at(-1)[0];
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


it('saves to the account without generating a PDF and preserves the same retry payload', async () => {
  const { saveProject } = await import('../src/services/projects');
  saveProject.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce({ id: 'project-demo', revision: 1 });
  const wrapper = mount(Dashboard); await flushPromises();
  await wrapper.get('#project-name').setValue('Mi obra');
  await wrapper.get('#budget-client').setValue('Cliente');
  await wrapper.get('#budget-catalog-item').setValue('losa_metal'); await button(wrapper, 'Agregar ítem').trigger('click');
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('Sin conexión');
  const first = JSON.parse(JSON.stringify(saveProject.mock.calls.at(-1)[0]));
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  expect(saveProject.mock.calls.at(-1)[0]).toEqual(first);
  expect(buildBudgetPdf).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain('Versión 1');
  wrapper.unmount();
});

it('loads saved quantities and prices without replacing them from the current catalog', async () => {
  const { loadProject, saveProject } = await import('../src/services/projects');
  loadProject.mockResolvedValue({ revision: 4, name: 'Guardado', version: { budget: { cliente: 'Cliente anterior', tipoInmueble: 'Local', items: [{ codigo: 'OLD', descripcion: 'Trabajo original', cantidad: 3, unidad: 'm', precioUnitario: 100 }] }, profile: { nombre1: 'Profesional original', correo: 'demo@example.invalid' } } });
  saveProject.mockResolvedValue({ id: 'saved', revision: 5 });
  const wrapper = mount(Dashboard, { props: { projectId: 'saved' } }); await flushPromises();
  expect(wrapper.get('[aria-label="Precio del ítem 1"]').element.value).toBe('100');
  await wrapper.get('[aria-label="Cantidad del ítem 1"]').setValue(4);
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  expect(saveProject.mock.calls.at(-1)[0]).toMatchObject({ id: 'saved', expectedRevision: 4, profile: { nombre1: 'Profesional original' }, budget: { total: 400 } });
  wrapper.unmount();
});

it('warns before leaving unsaved source data and respects cancellation', async () => {
  const { createRouter, createMemoryHistory } = await import('vue-router');
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/dashboard', component: Dashboard }, { path: '/other', component: { template: '<p>Otra página</p>' } }] });
  await router.push('/dashboard'); await router.isReady();
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } }); await flushPromises();
  await wrapper.get('#budget-client').setValue('Sin guardar');
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await router.push('/other'); expect(router.currentRoute.value.path).toBe('/dashboard');
  confirm.mockReturnValue(true); await router.push('/other'); expect(router.currentRoute.value.path).toBe('/other');
  confirm.mockRestore(); wrapper.unmount();
});

it('requires saving a reviewed new version before regenerating a PDF with a missing saved profile with current professional data', async () => {
  const { loadProject, saveProject } = await import('../src/services/projects');
  loadProject.mockResolvedValue({ revision: 1, name: 'Proyecto anterior', version: { budget: { cliente: 'Cliente', createdAt: '2026-10-20T12:00:00Z', items: [{ descripcion: 'Trabajo', cantidad: 1, unidad: 'ud.', precioUnitario: 100 }] }, profile: null } });
  saveProject.mockResolvedValue({ id: 'saved-one', revision: 2 });
  const wrapper = mount(Dashboard, { props: { projectId: 'saved-one' } }); await flushPromises();
  await button(wrapper, 'Descargar PDF').trigger('click'); await flushPromises();
  expect(buildBudgetPdf).not.toHaveBeenCalled(); expect(wrapper.get('[role="alert"]').text()).toContain('guardá una nueva versión');
  await button(wrapper, 'Guardar proyecto en mi cuenta').trigger('click'); await flushPromises();
  await button(wrapper, 'Descargar PDF').trigger('click'); await flushPromises();
  expect(buildBudgetPdf).toHaveBeenCalledOnce(); wrapper.unmount();
});

it('saves a trial project before generating its PDF and blocks saving after expiry without losing the draft', async () => {
  const { loadBillingAccess } = await import('../src/services/billing');
  const { saveProject } = await import('../src/services/projects');
  loadBillingAccess.mockResolvedValue({ enabled: true, trialStartedAt: Date.now() });
  saveProject.mockResolvedValue({ id: 'project-demo', revision: 1 });
  const wrapper = mount(Dashboard); await flushPromises();
  await wrapper.get('#budget-client').setValue('Primer cliente');
  await wrapper.get('#budget-catalog-item').setValue('losa_metal'); await button(wrapper, 'Agregar ítem').trigger('click');
  await button(wrapper, 'Descargar PDF').trigger('click'); await flushPromises();
  expect(saveProject).toHaveBeenCalledOnce(); expect(buildBudgetPdf).toHaveBeenCalledOnce();
  expect(saveProject.mock.invocationCallOrder[0]).toBeLessThan(buildBudgetPdf.mock.invocationCallOrder[0]);
  loadBillingAccess.mockResolvedValue({ enabled: true, trialStartedAt: Date.now() - 31 * 86400000 });
  await button(wrapper, 'Descargar PDF').trigger('click'); await flushPromises();
  expect(buildBudgetPdf).toHaveBeenCalledOnce(); expect(wrapper.text()).toContain('Ver suscripción');
  expect(wrapper.get('#budget-client').element.value).toBe('Primer cliente'); wrapper.unmount();
});
