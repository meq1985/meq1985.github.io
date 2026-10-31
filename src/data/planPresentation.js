// Marketing content only. Eligibility and checkout remain controlled by billingPolicy.
export const PLAN_PRESENTATION = Object.freeze({
  presupuestos: {
    title: 'Básico · Presupuestos', tag: 'PRESUPUESTO MANUAL',
    description: 'Elegí trabajos, ajustá cantidades y prepará tu propuesta.',
    features: ['Presupuesto manual desde el catálogo', 'Precios propios y ajustes porcentuales', 'Proyectos guardados e historial de versiones', 'PDF comercial con condiciones y promociones', 'Anticipo y saldo para pago al contado'],
  },
  croquis: {
    title: 'Full · Presupuestos + croquis', tag: 'DIBUJÁ, CALCULÁ Y COTIZÁ',
    description: 'Todo lo del Básico, más mano de obra y materiales desde el croquis de obra nueva.',
    features: ['Todas las funciones del Básico', 'Ambientes, niveles y puntos eléctricos', 'Medidor, tableros y jabalinas en el dibujo', 'Recorridos medidos, alturas y conexiones entre plantas', 'Propuesta de circuitos, cables y caída de tensión', 'Mano de obra del croquis con tus precios', 'Lista de materiales en una hoja aparte del PDF'],
  },
});
export const PLAN_COMPARISON = Object.freeze([
  { label: 'Presupuesto manual, catálogo y precios propios', basic: true },
  { label: 'PDF comercial, promociones y anticipo al contado', basic: true },
  { label: 'Proyectos guardados e historial de versiones', basic: true },
  { label: 'Croquis por plantas y conexiones dibujadas', basic: false },
  { label: 'Propuesta de circuitos, cables y caída de tensión', basic: false },
  { label: 'Lista de materiales y hoja adicional en el PDF', basic: false },
]);
