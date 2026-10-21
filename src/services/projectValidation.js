import { validateBudget } from './budgetValidation';

const text = (value, max, label) => {
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label}: revisá el texto ingresado.`);
  return value.trim();
};
export const profileKeys = ['nombre1', 'apellido1', 'cuit1', 'empresa1', 'matricula1', 'telefono1', 'direccion1', 'correo'];
export function projectProfile(profile, email) {
  return Object.fromEntries(profileKeys.map(key => [key, text(String((key === 'correo' ? email : profile?.[key]) ?? ''), key === 'correo' ? 254 : 160, 'Datos profesionales')]));
}
export function projectBudget(input) {
  if (!input || !Array.isArray(input.items) || !input.items.length || input.items.length > 200) throw new Error('El proyecto admite entre 1 y 200 trabajos.');
  text(input.cliente, 120, 'Cliente');
  for (const item of input.items) {
    text(item.descripcion, 1000, 'Descripción');
    if (String(item.codigo ?? '').length > 60) throw new Error('El código del trabajo es demasiado largo.');
  }
  const budget = validateBudget(input.cliente, input.items, input.tipoInmueble);
  const issued = new Date(input.createdAt);
  if (Number.isNaN(issued.getTime())) throw new Error('La fecha del presupuesto no es válida.');
  return { ...budget, items: budget.items.map(item => ({ ...item, codigo: String(item.codigo) })), createdAt: issued.toISOString() };
}
export function projectName(value, fallback) {
  const name = text(value || fallback, 120, 'Nombre del proyecto');
  if (!name) throw new Error('Ingresá un nombre para el proyecto.');
  return name;
}
export function validProjectId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('El proyecto no es válido.');
  return id;
}
export function validRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1000000) throw new Error('La versión no es válida.');
  return value;
}
