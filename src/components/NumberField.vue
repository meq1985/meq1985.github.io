<script setup>
import { ref, watch, useId } from 'vue';
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: [Number, String], default: null }, min: { type: [Number, String], default: 0 }, max: { type: [Number, String], default: undefined }, step: { type: [Number, String], default: 0.1 }, integer: Boolean, nullable: Boolean });
const emit = defineEmits(['update:modelValue']);
const draft = ref(String(props.modelValue ?? '')), editing = ref(false), invalid = ref(false), errorId = useId();
watch(() => props.modelValue, value => { if (!editing.value) draft.value = String(value ?? ''); });
function input(event) {
  editing.value = true; draft.value = event.target.value;
  if (!draft.value.trim()) { invalid.value = false; if (props.nullable) emit('update:modelValue', null); return; }
  const value = Number(draft.value);
  invalid.value = !Number.isFinite(value) || value < Number(props.min) || (props.max !== undefined && value > Number(props.max)) || (props.integer && !Number.isInteger(value));
  if (!invalid.value) emit('update:modelValue', value);
}
function finish() {
  editing.value = false;
  // Keep a temporary blank while typing, without storing an invalid drawing.
  draft.value = String(props.modelValue ?? ''); invalid.value = false;
}
</script>
<template>
  <span class="number-field"><input v-bind="$attrs" :value="draft" type="number" :min="min" :max="max" :step="step" :aria-invalid="invalid || undefined" :aria-describedby="invalid ? errorId : undefined" @focus="editing = true" @input="input" @blur="finish" /><small v-if="invalid" :id="errorId" role="status">{{ integer ? 'Ingresá un número entero válido.' : 'Ingresá una medida válida.' }}</small></span>
</template>
<style scoped>.number-field{display:block;min-width:0}.number-field small{display:block;margin-top:4px;color:#ffb6b6}</style>
