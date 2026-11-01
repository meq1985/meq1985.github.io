// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
vi.mock('../src/components/CatalogHeader.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../src/firebase/session', () => ({ requireUser: vi.fn(async () => ({ uid: 'demo' })), assertCurrentUser:vi.fn() }));
vi.mock('../src/services/projects', () => ({ listProjects: vi.fn(), listProjectVersions: vi.fn(), loadProjectVersion: vi.fn() }));
vi.mock('../src/services/budgetPdf', () => ({ buildBudgetPdf: vi.fn() }));
import { listProjects, listProjectVersions, loadProjectVersion } from '../src/services/projects';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import Projects from '../src/views/ProjectsView.vue';
const download = vi.fn();
const revision = { revision: 1, budget: { cliente: 'Cliente anterior', total: 123 }, profile: { nombre1: 'Profesional anterior' } };
const render = () => mount(Projects, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
beforeEach(() => { vi.clearAllMocks(); listProjects.mockResolvedValue({ items: [{ id: 'p', name: 'Proyecto', cliente: 'Cliente', total: 123, revision: 2 }], cursor: null, hasMore: false }); listProjectVersions.mockResolvedValue({ items: [revision], cursor: null, hasMore: false }); loadProjectVersion.mockResolvedValue(revision); buildBudgetPdf.mockResolvedValue({ save: download }); });
it('renders cloud projects and downloads old source snapshots using their original profile', async () => {
  const wrapper = render(); await flushPromises();
  await wrapper.get('[aria-label="Ver versiones de Proyecto"]').trigger('click'); await flushPromises();
  await wrapper.get('[aria-label="Descargar versión 1"]').trigger('click'); await flushPromises();
  expect(buildBudgetPdf).toHaveBeenCalledExactlyOnceWith(revision.budget, revision.profile, { sketch: revision.sketch, revision: revision.revision });
  expect(download).toHaveBeenCalledWith('presupuesto-Proyecto-v1.pdf'); wrapper.unmount();
});
it('does not silently assign present-day professional data to an imported old quote', async () => {
  loadProjectVersion.mockResolvedValue({ ...revision, profile: null });
  const wrapper = render(); await flushPromises();
  await wrapper.get('[aria-label="Descargar PDF de Proyecto"]').trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('no incluía datos profesionales');
  expect(buildBudgetPdf).not.toHaveBeenCalled(); wrapper.unmount();
});
it('shows load failures without pretending the cloud list is empty', async () => {
  listProjects.mockRejectedValue(new Error('Sin conexión'));
  const wrapper = render(); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('Sin conexión');
  expect(wrapper.text()).not.toContain('Tu próximo proyecto empieza acá'); wrapper.unmount();
});

it('prepares sharing from the chosen saved version without downloading or claiming it was sent', async () => {
 Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:version-pdf')});
 Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.open=true;}});
 const stored={...revision,budget:{cliente:'Cliente histórico',createdAt:'2026-01-01T12:00:00Z',total:123,items:[]}};
 listProjectVersions.mockResolvedValueOnce({items:[stored],hasMore:false});
 buildBudgetPdf.mockResolvedValueOnce({save:download,output:()=>new Blob(['%PDF-ficticio'],{type:'application/pdf'})});
 const w=render();await flushPromises();
 await w.get('[aria-label="Ver versiones de Proyecto"]').trigger('click');await flushPromises();
 await w.get('[aria-label="Compartir versión 1"]').trigger('click');await flushPromises();
 expect(buildBudgetPdf).toHaveBeenCalledExactlyOnceWith(stored.budget,stored.profile,{sketch:stored.sketch,revision:1});
 expect(w.get('dialog textarea').element.value).toContain('Cliente histórico');expect(download).not.toHaveBeenCalled();
 expect(w.get('dialog a[download]').attributes('download')).toBe('presupuesto-Proyecto-v1.pdf');w.unmount();
});
