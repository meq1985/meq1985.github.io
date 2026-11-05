// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import SketchEditor from '../src/components/SketchEditor.vue';
import { decodeSketch, encodeSketch } from '../src/services/sketch';
const button=(w,text)=>w.findAll('button').find(b=>b.text()===text);
const field=(w,text,type='input')=>w.findAll('label').find(l=>l.text().startsWith(text)).get(type);
const fixture=()=>({schema:1,levels:[{id:'pb',name:'PB'}],rooms:[{id:'r',levelId:'pb',name:'Sala',x:0,y:0,width:4,depth:3,points:[{id:'outlet',type:'toma',x:1,y:1}]}],equipment:[{id:'tg',type:'general',name:'TG',levelId:'pb',x:0,y:0,itemId:''}],feeders:[]});
const editor=()=>mount(defineComponent({components:{SketchEditor},setup:()=>({sketch:ref(fixture()),disabled:ref(false)}),template:'<SketchEditor v-model="sketch" :disabled="disabled" />'}));
it('edits an appliance from the drawing, preserves it and prevents edits in a disabled plan',async()=>{
  const w=editor();await w.get('[data-anchor=outlet]').trigger('click');
  const p=w.get('.point-load');await field(p,'Uso de esta toma','select').setValue('dedicated');
  await field(p,'Nombre de la carga').setValue('Horno');await field(p,'Potencia absorbida').setValue(3000);await field(p,'Factor de potencia').setValue(0.8);
  expect(w.vm.sketch.rooms[0].points[0].load).toEqual({kind:'dedicated',name:'Horno',powerW:3000,powerFactor:0.8});
  expect(decodeSketch(encodeSketch(w.vm.sketch)).rooms[0].points[0].load.name).toBe('Horno');
  w.vm.disabled=true;await w.vm.$nextTick();const before=JSON.stringify(w.vm.sketch);
  await field(p,'Uso de esta toma','select').setValue('TUE');expect(JSON.stringify(w.vm.sketch)).toBe(before);w.unmount();
});
it('shows conduit and cabinet settings without the fault and protection model panels', async () => {
  const w=editor();
  await button(w,'Trazar conexión').trigger('click');
  await w.get('[data-anchor=tg]').trigger('click');
  await w.get('[data-anchor=outlet]').trigger('click');
  await button(w,'Calcular instalación').trigger('click');
  await button(w,'Calcular circuitos y cables').trigger('click');
  expect(w.vm.sketch.materials.calculation.profile).toBe('cu-pvc-iram-40-v2');
  const review=w.get('.electrical-review');
  expect(review.text()).not.toMatch(/Icc máxima en este tablero|Icc mínima|Modelos de protección|energía pasante/i);
  expect(review.get('table').text()).toContain('Corrugado recomendado');
  expect(review.get('table').text()).toContain('CL19');
  expect(review.get('table').text()).toContain('RSP16');
  await field(review,'Capacidad real del gabinete').setValue(24);
  expect(decodeSketch(encodeSketch(w.vm.sketch)).materials.calculation.technical.boards[0])
    .toMatchObject({id:'tg',enclosureModules:24});
  await button(review,'Tableros').trigger('click');
  expect(review.get('table').text()).toContain('Módulos ocupados');
  w.unmount();
});
