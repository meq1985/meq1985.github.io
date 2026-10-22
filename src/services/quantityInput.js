export function quantityStep(unit) {
  const value = String(unit ?? '').trim().toLowerCase();
  return ['m²', 'm2', 'm^2', 'm', 'metro', 'metros', 'hora', 'horas', 'h', 'kva', 'jornada de 8 h'].includes(value) ? 0.1 : 1;
}
