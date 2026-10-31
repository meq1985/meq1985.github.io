import { projectBudget } from './projectValidation';
import { newCommercialTerms } from './commercialTerms';

export function reusableBudget(source, projectId, { now = new Date(), includeSketch = true } = {}) {
  const budget = projectBudget(structuredClone(source.budget));
  budget.createdAt = new Date(now).toISOString();
  if (budget.commercialTerms) {
    const fresh = newCommercialTerms(projectId, now);
    budget.commercialTerms = { ...budget.commercialTerms, reference: fresh.reference, issuedOn: fresh.issuedOn };
  }
  return { budget, sketch: includeSketch ? structuredClone(source.sketch ?? null) : null };
}
export const duplicateLocation = (id, revision) => ({ path: '/dashboard', query: { duplicar: id, version: String(revision) } });
