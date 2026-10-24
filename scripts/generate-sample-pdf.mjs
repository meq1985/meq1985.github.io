import { mkdirSync, writeFileSync } from 'node:fs';
import { buildBudgetPdf } from '../src/services/budgetPdf.js';
import { sampleBudget, sampleProfile } from '../src/data/sampleBudget.js';
const doc = await buildBudgetPdf(sampleBudget, sampleProfile, { example: true });
mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/ejemplo-presupuesto-electrico.pdf', import.meta.url), Buffer.from(doc.output('arraybuffer')));
console.log('Public example generated with fictitious identities.');
