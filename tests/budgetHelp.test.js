// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BudgetHelp from '../src/components/BudgetHelp.vue';
const key = 'electricistaxpress:presupuestar-ayuda:v1';
beforeEach(() => { localStorage.clear(); });
it('opens on first ready use, remembers dismissal and can reopen on a specific topic', async () => {
  const w = mount(BudgetHelp, { props: { ready: false }, attachTo: document.body });
  expect(w.get('dialog').element.open).toBe(false);
  await w.setProps({ ready: true }); await flushPromises(); expect(w.get('dialog').element.open).toBe(true);
  await w.get('[aria-label="Cerrar ayuda"]').trigger('click'); expect(localStorage.getItem(key)).toBe('seen');
  expect(w.get('dialog').element.open).toBe(false); w.unmount();
  const again = mount(BudgetHelp, { props: { ready: true } }); await flushPromises(); expect(again.get('dialog').element.open).toBe(false);
  await again.vm.show('recorridos'); expect(again.get('dialog').element.open).toBe(true); expect(again.text()).toContain('tramo de 5 m');
  await again.get('dialog').trigger('cancel'); expect(again.get('dialog').element.open).toBe(false); again.unmount();
});
it('does not prevent opening or closing help when browser preferences are unavailable', async () => {
  const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('blocked'); });
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked'); });
  const w = mount(BudgetHelp, { props: { ready: true } }); await flushPromises(); expect(w.get('dialog').element.open).toBe(true);
  await w.get('[aria-label="Cerrar ayuda"]').trigger('click'); expect(w.get('dialog').element.open).toBe(false);
  w.unmount(); read.mockRestore(); write.mockRestore();
});
