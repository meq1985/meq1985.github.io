export const BOARD_IDS = ['tp_mono', 'tp_tri', 'seccional_8', 'seccional_36', 'seccional_54'];
export const SERVICE_IDS = ['gabinete_1', 'gabinete_2', 'gabinete_3', 'gabinete_4', 'pilar', 'cano', 'fusilera', 'gabinete_adicional'];
export const PAT_IDS = ['tp_pat', 'pat_servicio'];
export const includesPat = settings => ['tp_mono', 'tp_tri'].includes(settings.board) || ['gabinete_1', 'gabinete_2', 'gabinete_3', 'gabinete_4', 'pilar'].includes(settings.service);
export const DEFAULT_HEIGHTS = { toma: 0.3, llave: 1.1, techo: 2.4 };
export const sketchHeights = sketch => Object.fromEntries(Object.entries(DEFAULT_HEIGHTS).map(([key, value]) => [key, sketch?.quote?.heights?.[key] ?? value]));
export const emptyQuoteSettings = () => ({ workType: 'obra-nueva', heights: { ...DEFAULT_HEIGHTS }, bocaPolicy: 'lighting-includes-switch', areaPolicy: 'minimum-30', includeProject: true, extraBocas: 0, board: '', secondaryBoard: '', pat: '', service: '' });
export function validateQuoteSettings(input) {
  const s = input ?? emptyQuoteSettings();
  const fail = () => { throw Error('Revisá la configuración de obra nueva y las alturas.'); };
  if (s.workType !== 'obra-nueva' || s.bocaPolicy !== 'lighting-includes-switch' || s.areaPolicy !== 'minimum-30' || typeof s.includeProject !== 'boolean' || !Number.isInteger(s.extraBocas) || s.extraBocas < 0 || s.extraBocas > 300) fail();
  for (const [key, options] of [['board', BOARD_IDS], ['secondaryBoard', BOARD_IDS.filter(id => id.startsWith('seccional'))], ['pat', PAT_IDS], ['service', SERVICE_IDS]]) if (s[key] !== '' && !options.includes(s[key])) fail();
  const heights = {};
  for (const key of ['toma', 'llave', 'techo']) {
    const value = s.heights?.[key];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 20)) fail();
    heights[key] = value;
  }
  if (heights.techo !== null && ['toma', 'llave'].some(key => heights[key] !== null && heights[key] >= heights.techo)) fail();
  return { workType: 'obra-nueva', heights, bocaPolicy: s.bocaPolicy, areaPolicy: s.areaPolicy, includeProject: s.includeProject, extraBocas: s.extraBocas, board: s.board, secondaryBoard: s.secondaryBoard, pat: s.pat, service: s.service };
}
