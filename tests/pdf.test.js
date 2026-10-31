import { it, expect } from 'vitest';
import { buildBudgetPdf } from '../src/services/budgetPdf';
import { validateBudget } from '../src/services/budgetValidation';
import { sampleBudget, sampleProfile } from '../src/data/sampleBudget';
const profile = { nombre1: 'Martin', apellido1: 'Quiroga', cuit1: '20-12345678-9',
  empresa1: 'Instalaciones Demo', matricula1: 'MAT-123', telefono1: '2964 555123',
  correo: 'electricista@example.com', direccion1: 'Direccion de ejemplo 123' };
const budget = () => ({ ...validateBudget('Cliente Demo', [{ codigo: 'A26-008', descripcion: 'Cableado', unidad: 'tramo de 5 m', cantidad: 2, precioUnitario: 125.25 }]), createdAt: '2026-10-20T01:00:00Z' });
it('creates the public sample from the same generator with fictitious identity and consistent totals', async () => {
  expect(sampleBudget.items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)).toBe(sampleBudget.total);
  const doc = await buildBudgetPdf(sampleBudget, sampleProfile, { example: true });
  expect(doc.getNumberOfPages()).toBe(1);
  const pdf = doc.output();
  for (const text of ['DATOS FICTICIOS', 'VALORES ILUSTRATIVOS', 'Alex Ejemplo', 'electricista@example.com', '3.916.000,00', 'Cliente de ejemplo']) expect(pdf).toContain(text);
});
it('generates a professional PDF with all contact, tax, client and price data', async () => {
  const document = await buildBudgetPdf(budget(), profile);
  const blob = document.output('blob');
  expect(blob.type).toBe('application/pdf');
  const pdf = await blob.text();
  for (const text of ['%PDF-', 'Martin Quiroga', '20-12345678-9', 'Instalaciones Demo', 'MAT-123', '2964 555123',
    'electricista@example.com', 'Direccion de ejemplo 123', 'Cliente Demo', 'Cableado', 'A26-008', 'tramo de 5 m', '125,25', '250,50', 'TOTAL MANO DE OBRA', '19/10/2026']) expect(pdf).toContain(text);
  for (const absent of ['undefined', 'NaN', '(null)']) expect(pdf).not.toContain(absent);
  expect(document.getNumberOfPages()).toBe(1);
});
it.each([null, undefined, '', '   '])('omits an unassigned company without printing null or an empty label', async empresa1 => {
  const document = await buildBudgetPdf(budget(), { ...profile, empresa1 });
  const pdf = document.output();
  expect(pdf).not.toContain('Instalaciones Demo'); expect(pdf).not.toContain('Empresa:');
  expect(pdf).not.toContain('(null)'); expect(pdf).not.toContain('undefined');
  expect(pdf).toContain('Martin Quiroga');
});
it('paginates long estimates, repeats table headers and prints the total exactly once', async () => {
  const rows = Array.from({ length: 90 }, (_, index) => ({ codigo: `P-${index}`, descripcion: 'Trabajo detallado de canalizacion y cableado en ambiente residencial con sus conexiones y terminaciones.', unidad: 'boca', cantidad: 2, precioUnitario: 1000.25 }));
  const validated = { ...validateBudget('Cliente con un nombre largo '.repeat(4), rows), createdAt: '2026-10-20T12:00:00Z' };
  const document = await buildBudgetPdf(validated, { ...profile, nombre1: 'Electricista '.repeat(12), empresa1: 'Empresa '.repeat(18), correo: 'contacto.muy.extenso.para.prueba@example.com' });
  expect(document.getNumberOfPages()).toBeGreaterThan(2);
  const pdf = document.output();
  expect(pdf.match(/TOTAL MANO DE OBRA/g)).toHaveLength(1);
  expect(pdf).toContain('180.045,00');
  expect(pdf.match(/\(Importe\)/g)?.length).toBe(document.getNumberOfPages());
});
it('rejects invalid issue dates', async () => {
  await expect(buildBudgetPdf({ ...budget(), createdAt: 'invalid' }, profile)).rejects.toThrow('fecha');
});

it('prints the optional property type separately from the client name', async () => {
  const pdf = (await buildBudgetPdf({ ...budget(), tipoInmueble: 'Vivienda unifamiliar' }, profile)).output();
  expect(pdf).toContain('Tipo de inmueble: Vivienda unifamiliar');
  expect(pdf).toContain('Cliente Demo');
  expect((await buildBudgetPdf(budget(), profile)).output()).not.toContain('Tipo de inmueble:');
});

it('fits a normal 18-line budget and all three payment alternatives on one labor page',async()=>{
 const b={...validateBudget('Cliente de prueba',Array.from({length:18},(_,i)=>({codigo:'P-'+i,descripcion:['Boca completa en ambiente','Instalación de canalización','Montaje y conexionado de tablero'][i%3],unidad:'ud.',cantidad:1,precioUnitario:1000}))),createdAt:'2026-10-30T12:00:00Z',paymentOptions:{discountPercent:10,installments:[{count:3,surchargePercent:20},{count:6,surchargePercent:30},{count:12,surchargePercent:50}]}};
 const doc=await buildBudgetPdf(b,profile);expect(doc.getNumberOfPages()).toBe(1);
 const pdf=doc.output();for(const value of ['16.200,00','21.600,00','23.400,00','27.000,00','ALTERNATIVAS DE PAGO'])expect(pdf).toContain(value);
});
it('starts materials on a separate page and preserves the labor total',async()=>{
 const sketch={schema:1,levels:[{id:'ground',name:'Baja'}],rooms:[{id:'room',levelId:'ground',name:'Cocina',x:0,y:0,width:4,depth:3,points:[{id:'light',type:'luminaria',x:0.5,y:0.5}]}]};
 const doc=await buildBudgetPdf(budget(),profile,{sketch});expect(doc.getNumberOfPages()).toBe(2);
 const pdf=doc.output();expect(pdf).toContain('LISTA DE MATERIALES');expect(pdf).toContain('Caja para luminaria');
 expect(pdf.match(/TOTAL MANO DE OBRA/g)).toHaveLength(1);expect(pdf).toContain('250,50');
 expect((await buildBudgetPdf(budget(),profile,{sketch:{...sketch,rooms:[]}})).getNumberOfPages()).toBe(1);
});

it('prints commercial validity, scope, exclusions and an advance on discounted cash only', async () => {
 const {newCommercialTerms}=await import('../src/services/commercialTerms');
 const b={...budget(),paymentOptions:{discountPercent:10,installments:[{count:3,surchargePercent:20}]},commercialTerms:{...newCommercialTerms('demo','2026-10-31T12:00:00Z'),reference:'EX-2026-001',issuedOn:'2026-10-31',validityDays:15,workAddress:'Obra de ejemplo 123',scope:'Montaje y conexionado',exclusions:'Pintura y albañilería',executionPeriod:'5 días',paymentTerms:'Saldo contra entrega',advancePercent:30}};
 const doc=await buildBudgetPdf(b,profile,{revision:2});const pdf=doc.output();
 for(const value of ['EX-2026-001','Versión 2','31/10/2026','15/11/2026','CONDICIONES DEL PRESUPUESTO','Montaje y conexionado','Obra de ejemplo 123','Saldo contra entrega','67,64','157,81','300,60'])expect(pdf).toContain(value);
 expect(doc.getNumberOfPages()).toBe(1);expect(pdf.match(/TOTAL MANO DE OBRA/g)).toHaveLength(1);
});
it('paginates extensive commercial conditions without losing content or the labor total', async () => {
 const {newCommercialTerms}=await import('../src/services/commercialTerms');
 const b={...budget(),items:Array.from({length:18},()=>budget().items[0]),commercialTerms:{...newCommercialTerms('long','2026-10-31T12:00:00Z'),scope:'Alcance detallado de los trabajos de instalación. '.repeat(16),exclusions:'Exclusión de tareas complementarias. '.repeat(20)}};
 const doc=await buildBudgetPdf(b,profile,{revision:3});expect(doc.getNumberOfPages()).toBeGreaterThan(1);expect(doc.output()).toContain('CONDICIONES DEL PRESUPUESTO');expect(doc.output().match(/TOTAL MANO DE OBRA/g)).toHaveLength(1);
 expect(doc.output()).toContain('Versión 3');
});

it('keeps eight lines, all commercial fields and financing alternatives on one labor page', async () => {
 const {newCommercialTerms}=await import('../src/services/commercialTerms');
 const rows=Array.from({length:8},(_,i)=>({codigo:'E-'+i,descripcion:'Instalación de canalización',unidad:'ud.',cantidad:1,precioUnitario:1000}));
 const b={...validateBudget('Cliente',rows,'Vivienda'),createdAt:'2026-10-31T12:00:00Z',paymentOptions:{discountPercent:10,installments:[{count:3,surchargePercent:20},{count:6,surchargePercent:35},{count:12,surchargePercent:60}]},commercialTerms:{...newCommercialTerms('normal','2026-10-31T12:00:00Z'),workAddress:'Obra de ejemplo',scope:'Instalación de los puntos detallados.',exclusions:'Pintura y albañilería.',executionPeriod:'5 días',paymentTerms:'Saldo contra finalización.',advancePercent:30}};
 const doc=await buildBudgetPdf(b,profile,{revision:1});expect(doc.getNumberOfPages()).toBe(1);expect(doc.output()).toContain('Anticipo: solo contado.');
});
