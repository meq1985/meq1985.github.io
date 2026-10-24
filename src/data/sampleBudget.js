// Public example: quantities and work structure from a supplied project.
// All identities, contact details and the address are fictitious.
export const sampleProfile = {
  nombre1: 'Alex', apellido1: 'Ejemplo', empresa1: 'Instalaciones de ejemplo',
  cuit1: '00-00000000-0 (ficticio)', matricula1: 'EJEMPLO-001',
  telefono1: '0000 000000 (ficticio)', correo: 'electricista@example.com',
  direccion1: 'Calle de ejemplo 123',
};
export const sampleBudget = {
  cliente: 'Cliente de ejemplo', tipoInmueble: 'Vivienda unifamiliar', createdAt: '2026-10-23T12:00:00Z',
  items: [
    { codigo: 'A26-003', descripcion: 'Boca completa: unidad básica de cotización', unidad: 'boca', cantidad: 43, precioUnitario: 50000, precioTotal: 2150000 },
    { codigo: 'A26-080', descripcion: 'Proyecto eléctrico por m²', unidad: 'm²', cantidad: 120, precioUnitario: 3300, precioTotal: 396000 },
    { codigo: 'A26-035', descripcion: 'Tablero general: de 8 a 36 polos', unidad: 'ud.', cantidad: 1, precioUnitario: 500000, precioTotal: 500000 },
    { codigo: 'A26-057', descripcion: 'Agregado de gabinete de medidor + tablero principal', unidad: 'ud.', cantidad: 2, precioUnitario: 50000, precioTotal: 100000 },
    { codigo: 'A26-012', descripcion: 'Amurado en mampostería: ladrillo común. Alimentación del principal al general: 15,4 m', unidad: 'm', cantidad: 15.4, precioUnitario: 50000, precioTotal: 770000 },
  ],
  total: 3916000,
};
