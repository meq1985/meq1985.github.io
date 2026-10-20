export function validateBudget(cliente, rows) {
  if (!cliente.trim()) throw new Error('Ingresá el nombre del cliente.');
  if (!rows.length) throw new Error('Agregá al menos un ítem.');
  let total = 0;
  const items = rows.map(row => {
    const cantidad = Number(row.cantidad);
    const precioUnitario = Number(row.precioUnitario);
    if (!row.descripcion?.trim() || !Number.isFinite(cantidad) || cantidad <= 0 ||
        (typeof row.precioUnitario !== 'number' && typeof row.precioUnitario !== 'string') ||
        !String(row.precioUnitario).trim() ||
        !Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new Error('Cada ítem necesita descripción, cantidad positiva y precio válido (cero o mayor).');
    }
    const precioTotal = Math.round(cantidad * precioUnitario * 100) / 100;
    if (!Number.isSafeInteger(Math.round(precioTotal * 100))) throw new Error('El importe es demasiado grande.');
    total += precioTotal;
    return { codigo: row.codigo ?? '', descripcion: row.descripcion.trim(), cantidad, precioUnitario, precioTotal };
  });
  total = Math.round(total * 100) / 100;
  if (!Number.isSafeInteger(Math.round(total * 100))) throw new Error('El total es demasiado grande.');
  return { cliente: cliente.trim(), items, total };
}
