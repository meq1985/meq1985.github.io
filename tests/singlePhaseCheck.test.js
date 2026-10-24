import { expect, it } from 'vitest';
import { singlePhaseCheck } from '../src/services/singlePhaseCheck';
const example = () => ({ apparentVA: 440, voltage: 220, meters: 24, resistance: 7.98, powerFactor: .95,
  limitPercent: 2, ignoreReactance: true, breakerA: 10, correctedAmpacityA: 21, breakingKA: 3, prospectiveKA: null });
it('reproduces the supplied 11 point case without premature rounding or an extra power factor in S/U', () => {
  const result = singlePhaseCheck(example());
  expect(result.current).toBe(2); expect(result.drop).toBeCloseTo(.727776, 10);
  expect(result.percent).toBeCloseTo(.330807272727, 10); expect(result.withinLimit).toBe(true);
  expect(result.overloadCheck).toBe(true); expect(result.breakingCheck).toBeNull(); expect(result.status).toBe('partial');
});
it('includes reactance only when supplied and checks limits using full precision', () => {
  expect(() => singlePhaseCheck({ ...example(), ignoreReactance: false })).toThrow();
  expect(singlePhaseCheck({ ...example(), ignoreReactance: false, reactance: 1 }).drop).toBeGreaterThan(.727776);
  expect(singlePhaseCheck({ ...example(), limitPercent: .33 }).withinLimit).toBe(false);
});
it('does not confirm incomplete protection data and rejects insufficient breaking capacity', () => {
  expect(singlePhaseCheck({ ...example(), breakerA: null }).overloadCheck).toBeNull();
  expect(singlePhaseCheck({ ...example(), correctedAmpacityA: 8 }).overloadCheck).toBe(false);
  expect(singlePhaseCheck({ ...example(), prospectiveKA: 6 }).breakingCheck).toBe(false);
});
it('rejects nonfinite, missing and unit-invalid input values', () => {
  for (const edit of [{ apparentVA: '440' }, { voltage: 0 }, { powerFactor: 1.1 }, { meters: -24 }, { resistance: Infinity }, { breakerA: 0 }]) {
    expect(() => singlePhaseCheck({ ...example(), ...edit })).toThrow();
  }
});
