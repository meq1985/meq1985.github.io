// Marketing content only. Eligibility and checkout remain controlled by billingPolicy.
export const PLAN_PRESENTATION = Object.freeze({
  presupuestos: {
    title: 'Básico · Presupuestos', tag: 'PRESUPUESTO MANUAL',
    description: 'Elegí trabajos, ajustá cantidades y prepará tu propuesta.',
    features: ['Presupuesto manual desde el catálogo', 'Precios propios y ajustes porcentuales', 'Proyectos guardados e historial de versiones', 'PDF con tus datos profesionales'],
  },
  croquis: {
    title: 'Full · Presupuestos + croquis', tag: 'PRESUPUESTO CON CROQUIS',
    description: 'Todo lo del Básico, más el dibujo de tu obra nueva.',
    features: ['Todas las funciones del Básico', 'Ambientes, niveles y puntos eléctricos', 'Medidor, tableros y jabalinas', 'Recorridos medidos entre principal y general', 'Borrador de mano de obra desde el croquis'],
  },
});
