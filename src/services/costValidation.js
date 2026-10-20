import { updateDoc } from 'firebase/firestore';
export function normalizePrices(values) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => {
    if (value === null || value === '') return [key, null];
    if ((typeof value !== 'number' && typeof value !== 'string') ||
        !Number.isFinite(Number(value)) || Number(value) < 0 || !String(value).trim()) {
      throw new Error('Los costos deben ser números válidos, cero o mayores.');
    }
    const amount = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    if (!Number.isSafeInteger(Math.round(amount * 100))) throw new Error('El costo es demasiado grande.');
    return [key, amount];
  }));
}
export function updatePrices(reference, values) { return updateDoc(reference, normalizePrices(values)); }
