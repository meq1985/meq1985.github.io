import { materialsFromSketch } from './materialNetwork';
import { proposeElectrical, withAutomaticConductors } from './automaticDesign';
export function sketchMaterials(sketch) {
  if (!sketch) return null;
  const design = proposeElectrical(sketch), result = materialsFromSketch(withAutomaticConductors(sketch, design));
  if (design) {
    for (const row of result.rows) if (row.description.startsWith('Conductor ')) row.description = row.description.replace('familia a confirmar', 'cobre unipolar PVC · propuesta');
    result.warnings = [...result.warnings.filter(w => !w.startsWith('Las medidas incluyen')), 'Se incluyen las verticales calculadas según alturas; revisar los tramos pendientes.', ...design.warnings];
  }
  if (design?.review) {
    const review=design.review;
    const checkLabel=value=>({pass:'cumple este chequeo',fail:'no cumple',pending:'pendiente'}[value]);
    const add=(description,quantity,sources)=>result.rows.push({description,unit:'ud.',quantity,purchaseQuantity:quantity,sources,pending:true});
    for(const c of [...design.feederCircuits,...design.circuits]) {
      if(c.breaker==null) continue;
      const check=review.circuits.find(x=>x.id===c.id);
      add(`Termomagnética 2P · ${c.breaker} A · curva ${check.curve} · ${check.requiredBreakingKA ? 'Icn mínimo '+check.requiredBreakingKA+' kA' : 'Icn pendiente'} · modelo a confirmar${c.status==='reserved'?' · circuito de reserva':''}`,1,[c.id]);
    }
    for(const b of review.boards.filter(b=>b.circuitCount)) {
      const row=result.rows.find(r=>r.sources.includes(b.id) && /Gabinete|Conjunto/.test(r.description));
      if(row) row.description+=` · mínimo ${b.minimumModules} módulos; propuesta ${b.proposedModules ?? 'mayor a 144'} · revisar disipación`;
      add(`Maniobra de entrada 2P · ${b.mainBreaker ?? 'calibre pendiente'} A · función/modelo a confirmar`,1,[b.id]);
      add(`Diferencial 2P · 30 mA · ${b.rcdRatedA ?? 'calibre pendiente'} A · tipo y respaldo a confirmar`,1,[b.id]);
    }
    result.warnings=result.warnings.filter(w=>!w.startsWith('Lista parcial: no verifica'));
    result.warnings.push(...review.warnings);
    for(const b of review.boards) if(b.status==='fail') result.warnings.push(`${b.name}: el gabinete no alcanza los módulos mínimos con reserva.`);
    for(const r of review.conduits) if(r.status==='fail') result.warnings.push(r.sharingInvalid ? `Canalización ${r.name}: separar los circuitos en cañerías independientes.` : `Canalización ${r.name}: revisar las medidas comerciales disponibles.`);
    for(const c of review.circuits) if(!c.reserved) result.warnings.push(`${c.name}: disparo magnético ${checkLabel(c.magnetic)}, poder de corte ${checkLabel(c.breaking)}, térmica ${checkLabel(c.thermal)}.`);
    result.warnings.push('Protecciones y maniobra son una previsión; revisar duplicados si se agregaron manualmente. Los módulos extra no agregan automáticamente DPS u otros equipos.');
  }
  return result;
}
