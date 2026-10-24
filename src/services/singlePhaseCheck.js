// Arithmetic check of one segment, not a complete installation design or AEA certification.
export function singlePhaseCheck(input) {
  const n = (key, min, max) => { const value = input[key]; if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw Error('Completá los valores del tramo con números válidos.'); return value; };
  const va = n('apparentVA', 0, 10000000), voltage = n('voltage', 1, 1000), meters = n('meters', 0, 10000);
  const resistance = n('resistance', 0, 10000), powerFactor = n('powerFactor', 0, 1), limit = n('limitPercent', 0.01, 100);
  const current = va / voltage;
  if (typeof input.ignoreReactance !== 'boolean') throw Error('Indicá si se considera la reactancia.');
  const reactance = input.ignoreReactance ? 0 : n('reactance', 0, 10000);
  const drop = 2 * meters / 1000 * current * (resistance * powerFactor + reactance * Math.sqrt(1 - powerFactor ** 2));
  const percent = drop * 100 / voltage;
  const optional = key => input[key] == null ? null : n(key, 0.001, 100000);
  const breaker = optional('breakerA'), ampacity = optional('correctedAmpacityA');
  const breaking = optional('breakingKA'), prospective = optional('prospectiveKA');
  return { current, drop, percent, withinLimit: percent <= limit,
    overloadCheck: breaker === null || ampacity === null ? null : current <= breaker && breaker <= ampacity,
    breakingCheck: breaking === null || prospective === null ? null : breaking >= prospective,
    status: 'partial' };
}
