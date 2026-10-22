import { validateSketch, sketchSummary, overlapsRoom } from './sketch';
import { validateBudget } from './budgetValidation';
import { validateQuoteSettings, includesPat } from './sketchQuoteSettings';

export function quoteFromSketch(input, entries) {
  const sketch = validateSketch(input);
  if (!sketch.rooms.length) throw Error('Agregá ambientes al croquis antes de calcular.');
  const s = validateQuoteSettings(sketch.quote);
  if (sketch.rooms.some(a => sketch.rooms.some(b => overlapsRoom(a, b)))) throw Error('Corregí los ambientes superpuestos antes de calcular la superficie.');
  if (['pilar', 'gabinete_adicional'].includes(s.service) && ['tp_mono', 'tp_tri'].includes(s.board)) throw Error('La acometida elegida ya incluye tablero principal. Quitá el tablero principal separado.');
  if (s.pat && includesPat(s)) throw Error('El tablero o la acometida elegidos ya incluyen PAT. Revisá la PAT separada para evitar duplicarla.');
  const summary = sketchSummary(sketch), rows = [];
  if (summary.llave && !summary.luminaria) throw Error('Hay llaves sin luminarias. Agregá los puntos de iluminación para cotizar sus bocas.');
  const add = (id, cantidad) => {
    if (!cantidad) return;
    const item = entries.find(entry => entry.id === id);
    if (!item || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) throw Error(`Falta un precio válido en tu cuenta para ${id}. Revisá Configuración.`);
    rows.push({ codigo: item.code, descripcion: item.description, unidad: item.unit, cantidad, precioUnitario: item.price });
  };
  const bocas = summary.luminaria + summary.toma + s.extraBocas;
  add('boca_completa', bocas);
  const area = s.includeProject ? Math.max(30, summary.area) : 0;
  add('proyecto_m2', area);
  for (const id of [s.board, s.secondaryBoard, s.pat, s.service]) if (id) add(id, 1);
  if (!rows.length) throw Error('Agregá puntos o seleccioná al menos un trabajo para presupuestar.');
  return { rows, bocas, area, summary, total: validateBudget('Borrador de obra nueva', rows).total };
}
