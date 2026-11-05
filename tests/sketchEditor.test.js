// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import SketchEditor from '../src/components/SketchEditor.vue';
import { emptyQuoteSettings } from '../src/services/sketchQuoteSettings';
import { LABOR_CATALOG } from '../src/data/laborCatalog';
const button = (w, text) => w.findAll('button').find(b => b.text() === text);
const input = (w, text) => w.findAll('label').find(l => l.text() === text).get('input');
function editor() {
  return mount(defineComponent({ components: { SketchEditor }, setup: () => ({ sketch: ref(null), disabled: ref(false), entries: LABOR_CATALOG }), template: '<SketchEditor v-model="sketch" :disabled="disabled" :entries="entries" />' }));
}
it('can erase the default room dimension and type a new one without selecting the old number', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  const width = input(w, 'Ancho (m)'); await width.setValue('');
  expect(width.element.value).toBe(''); expect(w.vm.sketch.rooms[0].width).toBe(4);
  await width.setValue('6.3'); expect(w.vm.sketch.rooms[0].width).toBe(6.3); w.unmount();
});
it('draws boards and feeder connections on the canvas, measures bends and undoes equipment deletion', async () => {
  const w = editor(), svg = w.get('.sketch-canvas');
  vi.spyOn(svg.element, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 360, height: 270 });
  await button(w, 'Medidor + TP').trigger('click'); await svg.trigger('click', { clientX: 0, clientY: 0 });
  await button(w, 'Tablero').trigger('click'); await svg.trigger('click', { clientX: 180, clientY: 240 });
  expect(w.vm.sketch.equipment.map(e => e.type)).toEqual(['medidor_tp', 'general']);
  await button(w, 'Trazar conexión').trigger('click');
  await w.get(`[data-anchor="${w.vm.sketch.equipment[0].id}"]`).trigger('click');
  await w.get(`[data-anchor="${w.vm.sketch.equipment[1].id}"]`).trigger('click');
  const field = w.findAll('label').find(l => l.text().startsWith('Verticales extra')).get('input');
  await field.setValue(2);
  expect(w.vm.sketch.feeders[0].verticalMeters).toBe(2);
  svg.element.getBoundingClientRect.mockReturnValue({ left: 0, top: 0, width: 360, height: 300 });
  await button(w, 'Dibujar quiebres de materiales').trigger('click'); await svg.trigger('click', { clientX: 0, clientY: 240 });
  expect(w.vm.sketch.feeders[0].bends).toEqual([{ x: 0, y: 8 }]);
  await button(w, 'Ver materiales').trigger('click');
  await w.findAll('button').filter(b => b.text() === 'Quitar equipo')[1].trigger('click');
  expect(w.vm.sketch.feeders).toHaveLength(0); expect(w.vm.sketch.materials.routes).toHaveLength(0);
  await button(w, 'Deshacer').trigger('click'); expect(w.vm.sketch.feeders).toHaveLength(1);
  w.unmount();
});
it('does not discard independently edited heights when undoing geometry', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  w.vm.sketch = { ...w.vm.sketch, quote: { ...emptyQuoteSettings(), heights: { toma: 0.4, llave: 1.1, techo: 2.8 } } }; await w.vm.$nextTick();
  await button(w, 'Deshacer').trigger('click');
  expect(w.vm.sketch.rooms).toHaveLength(0); expect(w.vm.sketch.quote.heights.techo).toBe(2.8);
  await button(w, 'Rehacer').trigger('click'); expect(w.vm.sketch.rooms).toHaveLength(1); expect(w.vm.sketch.quote.heights.toma).toBe(0.4);
  w.unmount();
});
it('keeps existing connections visible without intercepting bends of a new trace', async () => {
  const w = editor();
  const svg = w.get('.sketch-canvas');
  const bounds = vi.spyOn(svg.element, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 360, height: 270 });
  await button(w, 'Medidor + TP').trigger('click');
  await svg.trigger('click', { clientX: 0, clientY: 0 });
  await button(w, 'Tablero').trigger('click');
  await svg.trigger('click', { clientX: 180, clientY: 240 });
  bounds.mockReturnValue({ left: 0, top: 0, width: 360, height: 300 });
  await button(w, 'Jabalina').trigger('click');
  await svg.trigger('click', { clientX: 270, clientY: 30 });
  const [meter, board, ground] = w.vm.sketch.equipment;
  const anchor = item => w.get(`[data-anchor="${item.id}"]`);
  await button(w, 'Trazar conexión').trigger('click');
  await anchor(meter).trigger('click');
  await anchor(board).trigger('click');

  const existing = w.get('[data-material-route]');
  expect(existing.find('polyline[pointer-events="stroke"]').exists()).toBe(true);
  await button(w, 'Trazar conexión').trigger('click');
  await anchor(board).trigger('click');
  expect(existing.attributes('pointer-events')).toBe('none');
  expect(existing.attributes('tabindex')).toBe('-1');
  expect(existing.find('polyline[pointer-events="stroke"]').exists()).toBe(false);
  expect(existing.find('polyline').exists()).toBe(true);
  await existing.trigger('keydown', { key: 'Enter' });
  await svg.trigger('click', { clientX: 90, clientY: 120 });
  await anchor(ground).trigger('click');

  expect(w.vm.sketch.materials.routes).toHaveLength(2);
  expect(w.vm.sketch.materials.routes[1].bends).toEqual([{ x: 3, y: 4 }]);
  expect(existing.find('polyline[pointer-events="stroke"]').exists()).toBe(true);
  w.unmount();
});
it('adds rooms, sizes and levels, preserves points on resize, and undoes level removal', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  await input(w, 'Nombre del ambiente').setValue('Cocina');
  await input(w, 'Ancho (m)').setValue('5');
  await button(w, 'Luminaria').trigger('click');
  await button(w, 'Agregar al centro de Cocina').trigger('click');
  expect(w.vm.sketch.rooms[0]).toMatchObject({ width: 5, points: [{ type: 'luminaria', x: 0.5, y: 0.5 }] });
  expect(w.find('.sketch-summary').text()).toContain('15 m²');
  await button(w, '+ Nivel').trigger('click'); await button(w, '+ Ambiente').trigger('click');
  await button(w, 'Toma').trigger('click'); await button(w, 'Agregar al centro de Ambiente 2').trigger('click');
  expect(w.findAll('.sketch-room')).toHaveLength(1);
  await button(w, 'Quitar nivel').trigger('click');
  expect(w.vm.sketch.rooms).toHaveLength(1);
  await button(w, 'Deshacer').trigger('click'); expect(w.vm.sketch.rooms).toHaveLength(2);
  await button(w, 'Rehacer').trigger('click'); expect(w.vm.sketch.rooms).toHaveLength(1);
  w.unmount();
});
it('places touch/click points relative to the room and removes them accessibly', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  const svg = w.get('svg'); vi.spyOn(svg.element, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 50, width: 360, height: 270 });
  await button(w, 'Llave').trigger('click');
  await w.get('.sketch-room').trigger('click', { clientX: 130, clientY: 80 });
  expect(w.vm.sketch.rooms[0].points[0]).toMatchObject({ type: 'llave', x: 0.25, y: 1 / 3 });
  await w.get('[aria-label="Quitar Llave 1"]').trigger('click'); expect(w.vm.sketch.rooms[0].points).toHaveLength(0);
  await button(w, 'Deshacer').trigger('click'); expect(w.vm.sketch.rooms[0].points).toHaveLength(1);
  w.unmount();
});
it('reserves touch gestures only in selection mode and commits only the active finger’s drag', async () => {
  const w = editor();
  await button(w, '+ Ambiente').trigger('click');
  const svg = w.get('.sketch-canvas');
  vi.spyOn(svg.element, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 360, height: 270 });
  const room = w.get('.sketch-room');
  const touch = { pointerType: 'touch', pointerId: 1, isPrimary: true, button: 0 };
  async function dispatch(target, type, options) {
    target.element.dispatchEvent(new PointerEvent(type, { bubbles: true, ...touch, ...options }));
    await w.vm.$nextTick();
  }
  expect(w.find('.room-drag-surface').exists()).toBe(true);
  await dispatch(room, 'pointerdown', { clientX: 20, clientY: 20 });
  await dispatch(svg, 'pointermove', { clientX: 50, clientY: 80 });
  await dispatch(svg, 'pointercancel', { pointerId: 2, isPrimary: false });
  expect(room.classes()).toContain('dragging');
  await dispatch(svg, 'pointerup', { clientX: 50, clientY: 80 });
  expect(w.vm.sketch.rooms[0]).toMatchObject({ x: 1, y: 2 });
  await dispatch(room, 'pointerdown', { clientX: 50, clientY: 80 });
  await dispatch(svg, 'pointermove', { clientX: 80, clientY: 110 });
  await dispatch(svg, 'pointercancel');
  expect(room.classes()).not.toContain('dragging');
  expect(w.vm.sketch.rooms[0]).toMatchObject({ x: 1, y: 2 });
  await button(w, 'Toma').trigger('click');
  expect(w.find('.room-drag-surface').exists()).toBe(false);
  w.unmount();
});
it('rejects invalid measures visibly and prevents SVG changes while saving', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  const widthInput = input(w, 'Ancho (m)');
  await widthInput.setValue('0');
  expect(widthInput.attributes('aria-invalid')).toBe('true');
  await widthInput.trigger('blur');
  expect(w.vm.sketch.rooms[0].width).toBe(4); expect(input(w, 'Ancho (m)').element.value).toBe('4');
  await button(w, 'Toma').trigger('click'); w.vm.disabled = true; await w.vm.$nextTick();
  await w.get('.sketch-room').trigger('click', { clientX: 1, clientY: 1 }); expect(w.vm.sketch.rooms[0].points).toHaveLength(0);
  w.unmount();
});
