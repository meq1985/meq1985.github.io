// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import SketchEditor from '../src/components/SketchEditor.vue';
import { emptySketch } from '../src/services/sketch';
import { materialsFromSketch } from '../src/services/materialNetwork';
import { emptyQuoteSettings } from '../src/services/sketchQuoteSettings';
const fixture = () => ({ ...emptySketch(), rooms: [{ id: 'room', name: 'Estar', levelId: 'planta-baja', x: 0, y: 0, width: 4, depth: 3,
  points: [{ id: 'light', type: 'luminaria', x: 1, y: 0 }, { id: 'outlet', type: 'toma', x: 0, y: 1 }] }] });
const button = (w, name) => w.findAll('button').find(b => b.text() === name);
const field = (w, name, tag) => w.findAll('label').find(l => l.text().startsWith(name)).get(tag);
const editor = () => mount(defineComponent({ components: { SketchEditor }, setup: () => ({ sketch: ref(fixture()), disabled: ref(false) }),
  template: '<SketchEditor v-model="sketch" :disabled="disabled" />' }));
it('edits shared materials, draws bends, removes orphan routes and restores them through undo', async () => {
  const w = editor();
  await button(w, 'Conectar').trigger('click');
  await w.get('[data-anchor=light]').trigger('click');
  await w.get('[data-anchor=outlet]').trigger('click');
  const controls = w.get('.material-controls');
  await button(w, 'Agregar circuito').trigger('click');
  expect(w.vm.sketch.schema).toBe(2); expect(w.vm.sketch.materials.routes).toHaveLength(1);
  await field(controls, 'Circuito del conductor', 'select').setValue(w.vm.sketch.materials.circuits[0].id);
  await field(controls, 'Sección elegida', 'input').setValue(2.5);
  await button(w, 'Agregar o actualizar conductor del tramo').trigger('click');
  expect(materialsFromSketch(w.vm.sketch).rows.find(r => r.description.startsWith('Conductor Fase')).quantity).toBe(5);
  await button(w, 'Dibujar quiebres de materiales').trigger('click');
  const svg = w.get('.sketch-canvas'); svg.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 270 });
  await svg.trigger('click', { clientX: 0, clientY: 0 });
  expect(w.vm.sketch.materials.routes[0].bends).toEqual([{ x: 0, y: 0 }]);
  expect(materialsFromSketch(w.vm.sketch).rows.find(r => r.description.startsWith('Conductor Fase')).quantity).toBe(7);
  await w.get('[aria-label="Quitar Luminaria 1"]').trigger('click');
  expect(w.vm.sketch.materials.routes).toHaveLength(0);
  await button(w, 'Deshacer').trigger('click'); expect(w.vm.sketch.materials.routes).toHaveLength(1);
  w.unmount();
});
it('does not mutate a disabled editor and reproduces the monophase case without approving breaking capacity', async () => {
  const w = editor(); await button(w, 'Ver materiales').trigger('click'); await button(w, 'Cargar caso de 11 bocas').trigger('click');
  expect(w.get('.phase-check').text()).toContain('0,7278 V');
  expect(w.get('.phase-check').text()).toContain('0,3308 %');
  expect(w.get('.phase-check').text()).toContain('pendiente: falta la corriente prevista');
  w.vm.disabled = true; await w.vm.$nextTick();
  const before = JSON.stringify(w.vm.sketch);
  await button(w, 'Calcular instalación').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  expect(JSON.stringify(w.vm.sketch)).toBe(before); w.unmount();
});

it('connects a light to its switch by keyboard, prevents duplicate pairs and cancels drafts', async () => {
  const w = editor(); w.vm.sketch.rooms[0].points[1].type = 'llave'; await w.vm.$nextTick();
  await button(w, 'Conectar').trigger('click');
  await w.get('[data-anchor=light]').trigger('keydown', { key: 'Enter' });
  await w.get('[data-anchor=outlet]').trigger('keydown', { key: ' ' });
  expect(w.vm.sketch.materials.routes[0].kind).toBe('control');
  await button(w, 'Conectar').trigger('click');
  await w.get('[data-anchor=outlet]').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  expect(w.vm.sketch.materials.routes).toHaveLength(1);
  await button(w, 'Trazar conexión').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  const svg = w.get('.sketch-canvas'); svg.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 270 });
  await svg.trigger('click', { clientX: 60, clientY: 60 });
  expect(w.vm.sketch.materials.routes).toHaveLength(1);
  await svg.trigger('keydown', { key: 'Escape' });
  expect(w.get('.sketch-tools').find('button[aria-pressed=true]').text()).toBe('Seleccionar');
  expect(w.text()).not.toContain('Circuitos, recorridos y materiales');
  expect(w.text()).not.toContain('Recorridos físicos');
  w.unmount();
});
it('traces a connection through the drawing and clears the draft when changing levels', async () => {
  const w = editor();
  await button(w, 'Trazar conexión').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  const svg = w.get('.sketch-canvas'); svg.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 270 });
  await svg.trigger('click', { clientX: 0, clientY: 0 }); await w.get('[data-anchor=outlet]').trigger('click');
  expect(w.vm.sketch.materials.routes[0].bends).toEqual([{ x: 0, y: 0 }]);
  expect(materialsFromSketch(w.vm.sketch).rows.some(r => r.quantity === 7)).toBe(true);
  await button(w, 'Ver materiales').trigger('click'); expect(w.text()).toContain('Descargar lista parcial CSV');
  await button(w, 'Conectar').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  await button(w, '+ Nivel').trigger('click');
  expect(w.text()).not.toContain('Tocá el elemento de destino.');
  w.unmount();
});
it('calculates circuits from drawn board connections and exposes equipment specification in materials', async () => {
  const w = editor();
  w.vm.sketch.quote = { ...emptyQuoteSettings(), heights: { techo: 3, toma: 0.3, llave: 1.2 } };
  w.vm.sketch.equipment = [{ id: 'tg', name: 'TG', type: 'general', levelId: 'planta-baja', x: 0, y: 0, itemId: '' }];
  w.vm.sketch.feeders = []; await w.vm.$nextTick();
  for (const point of ['light', 'outlet']) {
    await button(w, 'Conectar').trigger('click'); await w.get('[data-anchor=tg]').trigger('click'); await w.get(`[data-anchor=${point}]`).trigger('click');
  }
  await button(w, 'Calcular instalación').trigger('click'); await button(w, 'Calcular circuitos y cables').trigger('click');
  expect(w.vm.sketch.materials.calculation.profile).toBe('cu-pvc-b1-v1');
  expect(w.get('.auto-design').text()).toContain('IUG 1'); expect(w.get('.auto-design').text()).toContain('TUG 1');
  expect(w.get('.auto-design').text()).toContain('mm²');
  await button(w, 'Ver materiales').trigger('click');
  await field(w, 'Tipo, capacidad y montaje', 'input').setValue('Embutido 24 módulos');
  await field(w, 'Tipo, capacidad y montaje', 'input').trigger('change');
  expect(w.vm.sketch.equipment[0].specification).toBe('Embutido 24 módulos');
  expect(w.text()).toContain('Conductor Fase'); expect(w.text()).not.toContain('Opciones de materiales');
  w.unmount();
});
it('shows editable default heights beside the drawing and preserves custom heights through undo', async () => {
  const w = editor();
  expect(field(w, 'Altura de tomacorrientes', 'input').element.value).toBe('0.3');
  expect(field(w, 'Altura de llaves', 'input').element.value).toBe('1.1');
  expect(field(w, 'Altura de techo', 'input').element.value).toBe('2.4');
  await button(w, '+ Ambiente').trigger('click');
  await field(w, 'Altura de techo', 'input').setValue('2.8');
  expect(w.vm.sketch.quote.heights.techo).toBe(2.8);
  await button(w, 'Deshacer').trigger('click'); expect(w.vm.sketch.quote.heights.techo).toBe(2.8);
  w.vm.disabled = true; await w.vm.$nextTick();
  await field(w, 'Altura de techo', 'input').setValue('3'); expect(w.vm.sketch.quote.heights.techo).toBe(2.8);
  w.unmount();
});
