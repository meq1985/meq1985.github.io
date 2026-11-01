import { it, expect } from 'vitest';
import { reusableBudget, duplicateLocation } from '../src/services/reuseBudget';
import { newCommercialTerms } from '../src/services/commercialTerms';
import { sharePayload, whatsappLink, emailLink } from '../src/services/budgetSharing';
const source = () => ({ budget: {cliente:'Cliente',createdAt:'2026-01-01T12:00:00Z',commercialTerms:{...newCommercialTerms('old','2026-01-01T12:00:00Z'),scope:'Alcance',advancePercent:30},paymentOptions:{discountPercent:10,installments:[]},items:[{codigo:'1',descripcion:'Trabajo',cantidad:2,precioUnitario:1000}]},sketch:{schema:1,rooms:[]} });
it('clones a quote without changing old prices, conditions, validity duration or source dates', () => {
 const original=source(),copy=reusableBudget(original,'new',{now:'2026-10-31T12:00:00Z'});
 expect(copy.budget).toMatchObject({total:2000,commercialTerms:{reference:'EX-NEW',issuedOn:'2026-10-31',validityDays:15,advancePercent:30,scope:'Alcance'}});
 copy.budget.items[0].precioUnitario=5;copy.sketch.rooms.push({id:'new'});
 expect(original.budget.items[0].precioUnitario).toBe(1000);expect(original.sketch.rooms).toHaveLength(0);
 expect(original.budget.commercialTerms.issuedOn).toBe('2026-01-01');
 expect(reusableBudget(original,'basic',{includeSketch:false}).sketch).toBeNull();
 expect(duplicateLocation('old',7)).toEqual({path:'/dashboard',query:{duplicar:'old',version:'7'}});
});
it('prepares a private PDF File and a concise message from the chosen historical version', () => {
 const budget=reusableBudget(source(),'new',{now:'2026-10-31T12:00:00Z'}).budget;
 const payload=sharePayload({output:()=>new Blob(['%PDF-demo'],{type:'application/pdf'})},budget,{nombre1:'Alex',apellido1:'Ejemplo'},{name:'Obra de ejemplo',revision:3});
 expect(payload.filename).toBe('presupuesto-Obra_de_ejemplo-v3.pdf');expect(payload.file.type).toBe('application/pdf');
 expect(payload.message).toContain('2.000');expect(payload.message).toContain('1.800');expect(payload.message).toContain('15/11/2026');
 expect(payload.message).not.toMatch(/https?:\/\/|\/proyectos/);
});
it('encodes WhatsApp text and validates optional international phone numbers', () => {
 const url=new URL(whatsappLink('+54 9 (11) 1234-5678','Cliente & trabajo\nTotal: $100'));
 expect(url.hostname).toBe('wa.me');expect(url.pathname).toBe('/5491112345678');expect(url.searchParams.get('text')).toContain('& trabajo\n');
 expect(new URL(whatsappLink('','Hola')).pathname).toBe('/');
 for(const phone of ['javascript:evil','0123456789','123','+54911?text=evil']) expect(()=>whatsappLink(phone,'Hola')).toThrow();
});
it('prevents email header injection while keeping an editable message body', () => {
 const url=emailLink('cliente+obra@example.com','Presupuesto\r\nBcc: intruso','Mensaje & detalle\nPDF');
 expect(url).toContain('mailto:cliente%2Bobra@example.com?subject=');expect(url).not.toContain('\r');
 const params=new URLSearchParams(url.split('?')[1]);expect(params.has('bcc')).toBe(false);expect(params.get('subject')).not.toContain('\n');
 expect(params.get('body')).toBe('Mensaje & detalle\nPDF');
 for(const email of ['a@example.com\r\nBcc:x@y.com','a@example.com?cc=x@y.com','a@evil;victim@example.com'])expect(()=>emailLink(email,'x','y')).toThrow();
});
