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
  await button(w, 'Trazar conexión').trigger('click');
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
  await button(w, 'Trazar conexión').trigger('click');
  await w.get('[data-anchor=light]').trigger('keydown', { key: 'Enter' });
  await w.get('[data-anchor=outlet]').trigger('keydown', { key: ' ' });
  expect(w.vm.sketch.materials.routes[0].kind).toBe('control');
  await button(w, 'Trazar conexión').trigger('click');
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
it('traces a connection through the drawing and keeps the draft when changing levels', async () => {
  const w = editor();
  await button(w, 'Trazar conexión').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  const svg = w.get('.sketch-canvas'); svg.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 270 });
  await svg.trigger('click', { clientX: 0, clientY: 0 }); await w.get('[data-anchor=outlet]').trigger('click');
  expect(w.vm.sketch.materials.routes[0].bends).toEqual([{ x: 0, y: 0 }]);
  expect(materialsFromSketch(w.vm.sketch).rows.some(r => r.quantity === 7)).toBe(true);
  await button(w, 'Ver materiales').trigger('click'); expect(w.text()).toContain('Descargar lista parcial CSV');
  await button(w, 'Trazar conexión').trigger('click'); await w.get('[data-anchor=light]').trigger('click');
  await button(w, '+ Nivel').trigger('click');
  expect(button(w,'Trazar conexión').attributes('aria-pressed')).toBe('true');
  w.unmount();
});
it('calculates circuits from drawn board connections and exposes equipment specification in materials', async () => {
  const w = editor();
  w.vm.sketch.quote = { ...emptyQuoteSettings(), heights: { techo: 3, toma: 0.3, llave: 1.2 } };
  w.vm.sketch.equipment = [{ id: 'tg', name: 'TG', type: 'general', levelId: 'planta-baja', x: 0, y: 0, itemId: '' }];
  w.vm.sketch.feeders = []; await w.vm.$nextTick();
  for (const point of ['light', 'outlet']) {
    await button(w, 'Trazar conexión').trigger('click'); await w.get('[data-anchor=tg]').trigger('click'); await w.get(`[data-anchor=${point}]`).trigger('click');
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
it('keeps the trace origin across floors, saves a cross-floor connection and removes it with the destination floor', async () => {
  const w=editor();w.vm.sketch.levels.push({id:'upper',name:'Alta',elevation:3});
  w.vm.sketch.rooms.push({id:'up-room',name:'Arriba',levelId:'upper',x:0,y:0,width:4,depth:3,points:[{id:'up-key',type:'llave',x:0,y:0}]});await w.vm.$nextTick();
  expect(button(w,'Conectar')).toBeUndefined();
  expect(w.get('.sketch-tools').text()).not.toContain('Ver materiales');
  expect(w.get('.sketch-result-actions').text()).toContain('Calcular instalación');
  await button(w,'Trazar conexión').trigger('click');await w.get('[data-anchor=light]').trigger('click');
  await field(w,'Nivel','select').setValue('upper');
  expect(w.text()).toContain('Origen: Estar · Luminaria');
  await w.get('[data-anchor=up-key]').trigger('click');
  const r=w.vm.sketch.materials.routes[0];expect([r.fromId,r.toId]).toEqual(['light','up-key']);expect(r.kind).toBe('control');
  expect(w.find(`[data-material-route="${r.id}"]`).exists()).toBe(true);
  expect(w.get('.material-controls').text()).toContain('Conexión seleccionada');
  await button(w,'Quitar nivel').trigger('click');expect(w.vm.sketch.materials.routes).toHaveLength(0);
  await button(w,'Deshacer').trigger('click');expect(w.vm.sketch.materials.routes).toHaveLength(1);w.unmount();
});
it('drags a room as one undoable edit, supports keyboard movement and cancels uncommitted drags', async () => {
  const w=editor(),svg=w.get('.sketch-canvas');
  const pointer=async(target,type,props)=>{const event=new MouseEvent(type,{bubbles:true,...props});Object.defineProperty(event,'pointerId',{value:props.pointerId});target.element.dispatchEvent(event);await w.vm.$nextTick();};svg.element.getBoundingClientRect=()=>({left:0,top:0,width:360,height:270});
  await pointer(w.get('.sketch-room'),'pointerdown',{pointerId:1,button:0,clientX:30,clientY:30});
  await pointer(svg,'pointermove',{pointerId:1,clientX:90,clientY:60});
  expect(w.vm.sketch.rooms[0].x).toBe(0);
  await pointer(svg,'pointerup',{pointerId:1,clientX:90,clientY:60});
  expect(w.vm.sketch.rooms[0].x).toBe(2);expect(w.vm.sketch.rooms[0].y).toBe(1);
  expect(w.vm.sketch.rooms[0].points[0].x).toBe(1);
  await button(w,'Deshacer').trigger('click');expect(w.vm.sketch.rooms[0].x).toBe(0);
  await w.get('.sketch-room').trigger('keydown',{key:'ArrowRight'});expect(w.vm.sketch.rooms[0].x).toBe(0.1);
  await pointer(w.get('.sketch-room'),'pointerdown',{pointerId:2,button:0,clientX:30,clientY:30});
  await pointer(svg,'pointermove',{pointerId:2,clientX:120,clientY:120});await pointer(svg,'pointercancel',{pointerId:2});
  expect(w.vm.sketch.rooms[0].x).toBe(0.1);w.unmount();
});
