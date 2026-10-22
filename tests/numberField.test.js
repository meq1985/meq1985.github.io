// @vitest-environment jsdom
import { it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import NumberField from '../src/components/NumberField.vue';
import { quantityStep } from '../src/services/quantityInput';
function field(props = {}) {
  return mount(defineComponent({ components: { NumberField }, setup: () => ({ value: ref(4), props }), template: '<NumberField v-model="value" v-bind="props" aria-label="Medida" />' }));
}
it('keeps a blank while editing, survives rerenders and accepts the replacement', async () => {
  const w = field({ min: 1, max: 50 }); const input = w.get('input');
  await input.setValue(''); w.vm.$forceUpdate(); await w.vm.$nextTick();
  expect(input.element.value).toBe(''); expect(w.vm.value).toBe(4);
  await input.setValue('5.2'); expect(w.vm.value).toBe(5.2);
  await input.trigger('blur'); expect(input.element.value).toBe('5.2'); w.unmount();
});
it('restores a required blank on blur and follows later model changes', async () => {
  const w = field({ min: 1 }); const input = w.get('input');
  await input.setValue(''); await input.trigger('blur'); expect(input.element.value).toBe('4');
  w.vm.value = 6; await w.vm.$nextTick(); expect(input.element.value).toBe('6'); w.unmount();
});
it('clears optional heights and rejects fractional discrete counts without changing the model', async () => {
  const height = field({ nullable: true, min: 0.1, step: 0.1 }); await height.get('input').setValue(''); expect(height.vm.value).toBeNull(); height.unmount();
  const units = field({ min: 1, integer: true, step: 1 }); await units.get('input').setValue('2.5');
  expect(units.vm.value).toBe(4); expect(units.get('input').attributes('aria-invalid')).toBe('true');
  await units.get('input').trigger('blur'); expect(units.get('input').element.value).toBe('4'); units.unmount();
});
it('uses tenths for measured quantities and whole steps for discrete units', () => {
  for (const unit of ['m²', 'm2', 'm', 'hora']) expect(quantityStep(unit)).toBe(0.1);
  for (const unit of ['ud.', 'boca', 'tablero', 'tramo de 5 m']) expect(quantityStep(unit)).toBe(1);
});
