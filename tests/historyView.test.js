// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/firebase/session', () => ({ requireUser: vi.fn() }));
vi.mock('../src/services/projects', () => ({ importLocalBudget: vi.fn() }));
vi.mock('../src/services/localBudgets', () => ({ listBudgets: vi.fn(), deleteBudget: vi.fn(), downloadBudget: vi.fn() }));
import { requireUser } from '../src/firebase/session';
import { listBudgets, deleteBudget, downloadBudget } from '../src/services/localBudgets';
import History from '../src/views/MisPresupuestos.vue';
const record = { id: 'one', owner: 'demo', cliente: 'Cliente Demo', total: 132000, createdAt: '2026-10-20T12:00:00Z' };
const render = () => mount(History, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
beforeEach(() => { vi.resetAllMocks(); requireUser.mockResolvedValue({ uid: 'demo' }); listBudgets.mockResolvedValue([record]); });
it('renders the shared design, client, amount, date and explicitly local storage', async () => {
  const wrapper = render(); await flushPromises();
  expect(wrapper.find('.catalog-page').exists()).toBe(true);
  expect(wrapper.text()).toContain('Cliente Demo');
  expect(wrapper.text()).toContain('132.000');
  expect(wrapper.get('time').attributes('datetime')).toBe(record.createdAt);
  expect(wrapper.text()).toContain('borrar los datos del navegador');
  await wrapper.get('[aria-label="Descargar presupuesto de Cliente Demo"]').trigger('click'); await flushPromises();
  expect(downloadBudget).toHaveBeenCalledExactlyOnceWith(record);
  wrapper.unmount();
});
it('requires confirmation before deletion and keeps the card if persistence fails', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const wrapper = render(); await flushPromises();
  const remove = wrapper.get('[aria-label="Eliminar presupuesto de Cliente Demo"]');
  await remove.trigger('click'); await flushPromises(); expect(deleteBudget).not.toHaveBeenCalled();
  confirm.mockReturnValue(true); deleteBudget.mockRejectedValueOnce(Error('Disco no disponible'));
  await remove.trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('Disco no disponible');
  expect(wrapper.findAll('.budget-card')).toHaveLength(1);
  deleteBudget.mockResolvedValueOnce();
  await remove.trigger('click'); await flushPromises();
  expect(deleteBudget).toHaveBeenLastCalledWith('demo', 'one');
  expect(wrapper.findAll('.budget-card')).toHaveLength(0);
  confirm.mockRestore(); wrapper.unmount();
});
it('rejects download after switching accounts and displays loading failures', async () => {
  const wrapper = render(); await flushPromises(); requireUser.mockResolvedValue({ uid: 'other' });
  await wrapper.get('[aria-label="Descargar presupuesto de Cliente Demo"]').trigger('click'); await flushPromises();
  expect(downloadBudget).not.toHaveBeenCalled(); expect(wrapper.get('[role="alert"]').text()).toContain('no coincide'); wrapper.unmount();
  listBudgets.mockRejectedValue(Error('Sin acceso')); const failed = render(); await flushPromises();
  expect(failed.get('[role="alert"]').text()).toContain('Sin acceso');
  expect(failed.find('.empty-history').exists()).toBe(false); failed.unmount();
});
it('offers a first-budget action when there are no saved budgets', async () => {
  listBudgets.mockResolvedValue([]); const wrapper = render(); await flushPromises();
  expect(wrapper.text()).toContain('Preparar mi primer presupuesto'); wrapper.unmount();
});


it('copies local budgets to the account without deleting their PDF', async () => {
  const { importLocalBudget } = await import('../src/services/projects');
  importLocalBudget.mockResolvedValue('local-one');
  const wrapper = render(); await flushPromises();
  await wrapper.findAll('button').find(item => item.text() === 'Copiar a mi cuenta').trigger('click'); await flushPromises();
  expect(importLocalBudget).toHaveBeenCalledExactlyOnceWith(record);
  expect(deleteBudget).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain('archivo original sigue guardado');
  expect(wrapper.findAll('.budget-card')).toHaveLength(1); wrapper.unmount();
});
