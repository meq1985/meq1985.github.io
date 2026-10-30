import { materialsFromSketch } from './materialNetwork';
import { proposeElectrical, withAutomaticConductors } from './automaticDesign';
export function sketchMaterials(sketch) {
  if (!sketch) return null;
  const design = proposeElectrical(sketch), result = materialsFromSketch(withAutomaticConductors(sketch));
  if (design) {
    for (const row of result.rows) if (row.description.startsWith('Conductor ')) row.description = row.description.replace('familia a confirmar', 'cobre unipolar PVC · propuesta');
    result.warnings = [...result.warnings.filter(w => !w.startsWith('Las medidas incluyen')), 'Se incluyen las verticales calculadas según alturas; revisar los tramos pendientes.', ...design.warnings];
  }
  return result;
}
