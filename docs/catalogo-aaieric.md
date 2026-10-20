# Catálogo de mano de obra AAIERIC

Fuente: PDF aportado por el titular del proyecto, «AAIERIC - Costos Sugeridos de Mano de Obra - Septiembre 2026.pdf», páginas 1 y 2. Transcripción contrastada visualmente: 98 importes, ARS, CABA/GBA, mano de obra para instalaciones residenciales y pequeños comercios hasta 10 kW. No se publica el PDF en este repositorio.

`src/data/laborCatalog.js` contiene las descripciones, unidades, precios sugeridos y notas. Los códigos A26 son identificadores propios de la aplicación. Mantener estables los IDs y códigos existentes al agregar ítems. Los mínimos y componentes de documentación son alternativas explícitas; la aplicación no calcula automáticamente el proyecto ni decide el alcance del certificado T2/T3. No se asigna un importe inventado a tableros especiales.

## Persistencia y actualización de cuentas

- Cada cuenta verificada conserva su documento `/costos/{email}` y agrega `catalog: { version, revision, prices }`. No hay nuevas colecciones, permisos públicos, Storage, funciones de pago ni dependencias incompatibles con Spark.
- Las cuentas nuevas reciben los 98 precios junto con la creación atómica de su perfil. Las cuentas existentes se actualizan en su próximo acceso o navegación protegida. No se requiere recorrer ni sobrescribir cuentas desde administración.
- La migración agrega el catálogo una sola vez y completa ítems faltantes de forma idempotente. Mantiene los campos originales intactos. Los importes históricos cargados por el usuario, incluido cero y la variante antigua de la clave PVC, aparecen en «Mis ítems anteriores»; no se adivinan equivalencias entre descripciones con distinto alcance.
- Los cambios individuales guardan únicamente los ítems modificados. Los ajustes porcentuales operan sobre los precios guardados actuales, para toda la cuenta o una categoría. La vista previa requiere aplicación explícita. Disminución máxima: 100%; aumento positivo, limitado por el rango monetario seguro. Redondeo a centavos.
- La transacción compara los importes revisados con los actuales. Ante cambios en otra pestaña cancela y pide recargar; un reintento no vuelve a aplicar el porcentaje.
- «Revisar valores sugeridos» restaura únicamente los 98 precios AAIERIC. No modifica los ítems anteriores.
- Cada presupuesto guarda sus cantidades, unidades e importes como una copia independiente. Cambiar la lista de precios no recalcula presupuestos anteriores. El PDF expresa la unidad y la moneda.

## Validación

`npm test` incluye catálogo, migración, límites, porcentajes, vistas y presupuestos. `npm run test:emulator` usa exclusivamente `demo-presupuesto-electrico` en Auth/Firestore locales: alta verificada con catálogo, reparación de cuentas, conservación de precios, persistencia y conflicto entre transacciones. `npm run build` genera el artefacto de producción.

Revisión de navegador con cuenta ficticia local: carga automática, aumento del 20%, persistencia al recargar, edición individual, disminución por categoría, restauración y presupuesto con unidades. No utilizar cuentas reales para pruebas de escritura.
