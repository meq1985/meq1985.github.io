import { validateSketch, sketchSummary, overlapsRoom } from './sketch';
import { validateBudget } from './budgetValidation';
import { validateQuoteSettings, includesPat } from './sketchQuoteSettings';
import { EQUIPMENT_TYPES, PACKAGE_PAT, feederLength, FEEDER_EXTRA_METERS } from './sketchInfrastructure';

export function quoteFromSketch(input, entries) {
  const sketch = validateSketch(input);
  if (!sketch.rooms.length) throw Error('Agregá ambientes al croquis antes de calcular.');
  const s = validateQuoteSettings(sketch.quote);
  if (sketch.rooms.some(a => sketch.rooms.some(b => overlapsRoom(a, b)))) throw Error('Corregí los ambientes superpuestos antes de calcular la superficie.');
  const drawn = sketch.equipment ?? [], warnings = [];
  if (!drawn.length && ['pilar', 'gabinete_adicional'].includes(s.service) && ['tp_mono', 'tp_tri'].includes(s.board)) throw Error('La acometida elegida ya incluye tablero principal. Quitá el tablero principal separado.');
  if (drawn.some(e => e.type === 'medidor_tp') && drawn.some(e => e.type === 'principal')) throw Error('El medidor con TP ya incluye tablero principal. Quitá el principal separado del croquis.');
  const summary = sketchSummary(sketch), rows = [];
  if (summary.llave && !summary.luminaria) throw Error('Hay llaves sin luminarias. Agregá los puntos de iluminación para cotizar sus bocas.');
  const add = (id, cantidad, detail = '') => {
    if (!cantidad) return;
    const item = entries.find(entry => entry.id === id);
    if (!item || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) throw Error(`Falta un precio válido en tu cuenta para ${id}. Revisá Configuración.`);
    rows.push({ codigo: item.code, descripcion: item.description + (detail ? ` · ${detail}` : ''), unidad: item.unit, cantidad, precioUnitario: item.price });
  };
  const bocas = summary.luminaria + summary.toma + s.extraBocas;
  add('boca_completa', bocas);
  const area = s.includeProject ? Math.max(30, summary.area) : 0;
  add('proyecto_m2', area);
  if (drawn.length) {
    let included = drawn.filter(e => PACKAGE_PAT.includes(e.itemId)).length, covered = 0;
    for (const e of drawn) {
      if (e.type === 'jabalina' && included > 0) { included--; covered++; continue; }
      if (!e.itemId) throw Error(`Elegí el trabajo del catálogo para ${e.name}.`);
      add(e.itemId, 1, `${EQUIPMENT_TYPES[e.type]}: ${e.name}`);
      if (e.type === 'general') rows.at(-1).descripcion = rows.at(-1).descripcion.replace(/^Tablero seccional:/, 'Tablero general:');
    }
    if (covered) warnings.push(covered === 1 ? '1 jabalina cubierta por la PAT incluida en los paquetes seleccionados; no se cobra aparte.' : `${covered} jabalinas cubiertas por la PAT incluida en los paquetes seleccionados; no se cobran aparte.`);
    if ([s.board, s.secondaryBoard, s.pat, s.service].some(Boolean)) warnings.push('Se usan los elementos dibujados; las selecciones manuales anteriores de tablero, PAT y acometida no se suman.');
  } else {
    for (const id of [s.board, s.secondaryBoard, s.service]) if (id) add(id, 1);
    if (s.pat && includesPat(s)) warnings.push('La PAT separada ya está incluida en el tablero o acometida; no se cobra otra vez.');
    else if (s.pat) add(s.pat, 1);
  }
  const measurements = (sketch.feeders ?? []).map(f => {
    const meters = feederLength(sketch, f);
    if (!f.itemId) {
      const from = drawn.find(e => e.id === f.fromId)?.name ?? 'Principal';
      const to = drawn.find(e => e.id === f.toId)?.name ?? 'General';
      throw Error(`Falta definir la mano de obra del recorrido «${from} → ${to}». Tocá esa conexión en el croquis y elegí «Mano de obra del recorrido» o «Solo medir» para no cobrarla aparte.`);
    }
    if (meters <= 0) throw Error('El recorrido necesita una longitud mayor que cero.');
    if (f.itemId === 'measure-only') warnings.push(`Recorrido de ${meters} m: solo medición, no incluido en el importe.`);
    else add(f.itemId, ['subterraneo_tierra', 'subterraneo_piso'].includes(f.itemId) ? Math.ceil(meters / 5) : meters, `Alimentación del principal al general: ${meters} m (incluye ${FEEDER_EXTRA_METERS} m de subida/bajada)`);
    return { id: f.id, meters };
  });
  if (!rows.length) throw Error('Agregá puntos o seleccioná al menos un trabajo para presupuestar.');
  return { rows, bocas, area, summary, warnings, measurements, total: validateBudget('Borrador de obra nueva', rows).total };
}
