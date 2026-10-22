// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import SketchQuote from '../src/components/SketchQuote.vue';
import { emptySketch } from '../src/services/sketch';
import { LABOR_CATALOG } from '../src/data/laborCatalog';
const button = (w, text) => w.findAll('button').find(b => b.text().includes(text));
function editor(existingCount = 0) {
  return mount(defineComponent({ components: { SketchQuote }, setup: () => ({ entries: LABOR_CATALOG, existingCount, sketch: ref({ ...emptySketch(), rooms: [{ id: 'r', levelId: 'planta-baja', name: 'Living', x: 0, y: 0, width: 4, depth: 3, points: [{ id: 'p', type: 'luminaria', x: 0.5, y: 0.5 }] }] }) }), template: '<SketchQuote v-model="sketch" :entries="entries" :existing-count="existingCount"/>' }));
}
it('persists heights, reviews a quote and requires explicit replacement before overwriting manual work', async () => {
  const w = editor(2), quote = w.getComponent(SketchQuote);
  await w.findAll('input[type="number"]')[0].setValue('0.4');
  expect(w.vm.sketch.quote.heights.toma).toBe(0.4);
  await button(w, 'Revisar presupuesto').trigger('click');
  expect(w.text()).toContain('30 m² a cotizar');
  expect(button(w, 'Reemplazar detalle').attributes('disabled')).toBeDefined();
  expect(quote.emitted('apply')).toBeUndefined();
  await w.findAll('input[type="checkbox"]')[1].setValue(true);
  await button(w, 'Reemplazar detalle').trigger('click');
  expect(quote.emitted('apply')).toHaveLength(1);
  expect(button(w, 'Borrador aplicado').attributes('disabled')).toBeDefined();
  w.unmount();
});
it('invalidates a preview after changing the drawing configuration and explains package conflicts', async () => {
  const w = editor(); await button(w, 'Revisar presupuesto').trigger('click');
  expect(w.find('.catalog-preview').exists()).toBe(true);
  await w.get('select').setValue('tp_mono'); expect(w.find('.catalog-preview').exists()).toBe(false);
  await w.findAll('select')[3].setValue('tp_pat');
  await button(w, 'Revisar presupuesto').trigger('click');
  expect(w.text()).toContain('no se cobra otra vez');
  expect(w.find('.catalog-preview').exists()).toBe(true); w.unmount();
});
