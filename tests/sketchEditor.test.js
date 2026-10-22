// @vitest-environment jsdom
import { it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import SketchEditor from '../src/components/SketchEditor.vue';
import { emptyQuoteSettings } from '../src/services/sketchQuoteSettings';
const button = (w, text) => w.findAll('button').find(b => b.text() === text);
const input = (w, text) => w.findAll('label').find(l => l.text() === text).get('input');
function editor() {
  return mount(defineComponent({ components: { SketchEditor }, setup: () => ({ sketch: ref(null), disabled: ref(false) }), template: '<SketchEditor v-model="sketch" :disabled="disabled" />' }));
}
it('does not discard independently edited heights when undoing geometry', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  w.vm.sketch = { ...w.vm.sketch, quote: { ...emptyQuoteSettings(), heights: { toma: 0.4, llave: 1.1, techo: 2.8 } } }; await w.vm.$nextTick();
  await button(w, 'Deshacer').trigger('click');
  expect(w.vm.sketch.rooms).toHaveLength(0); expect(w.vm.sketch.quote.heights.techo).toBe(2.8);
  await button(w, 'Rehacer').trigger('click'); expect(w.vm.sketch.rooms).toHaveLength(1); expect(w.vm.sketch.quote.heights.toma).toBe(0.4);
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
it('rejects invalid measures visibly and prevents SVG changes while saving', async () => {
  const w = editor(); await button(w, '+ Ambiente').trigger('click');
  await input(w, 'Ancho (m)').setValue('0');
  expect(w.get('[role="alert"]').text()).toContain('último valor válido');
  await input(w, 'Ancho (m)').trigger('blur');
  expect(w.vm.sketch.rooms[0].width).toBe(4); expect(input(w, 'Ancho (m)').element.value).toBe('4');
  await button(w, 'Toma').trigger('click'); w.vm.disabled = true; await w.vm.$nextTick();
  await w.get('.sketch-room').trigger('click', { clientX: 1, clientY: 1 }); expect(w.vm.sketch.rooms[0].points).toHaveLength(0);
  w.unmount();
});
