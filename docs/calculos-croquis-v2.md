# Ampliación de cálculos del croquis

Implementación preparada el 2 de noviembre de 2026. Alcance: propuesta residencial monofásica; no es una certificación ni un motor de conformidad reglamentaria completo. No modifica producción, facturación ni datos de usuarios.

## Referencias contrastadas y decisiones

Se contrastó AEA 90364-7-770, edición 2017, con la copia de la publicación original alojada por el Colegio de Ingenieros de Jujuy. Su alcance incluye límites de corriente y cortocircuito. AEA anuncia la edición 2026 en preventa, con entrega desde el 16/11/2026: no se trasladan requisitos supuestos de ese texto. Verificar adendas, edición aplicable y jurisdicción antes de usar el proyecto para ejecutar una obra.

- Se mantienen los mínimos y cantidades de circuitos y el cálculo IUG anteriores. Los 150 VA por toma siguen siendo el criterio personalizado pedido por el titular; el mínimo por circuito de la tabla sigue disponible explícitamente. No se presenta la estimación por toma como cumplimiento AEA.
- La clasificación de cargas especiales se contrasta con 770.6 y su demanda mínima con 770.8. Cada carga declarada usa un circuito independiente, decisión conservadora del producto, aunque la clasificación permita agrupar bocas. Los consumos superiores a la capacidad unitaria admitida del TUE quedan pendientes y requieren clasificación específica.
- Canalizaciones: se contrastaron agrupamiento y medidas con 770.10.3.8. Se avisa cuando compartir una línea no entra en la excepción de uso general; la corrección térmica por agrupamiento no resuelve esa incompatibilidad. Para mezcla de secciones se aplica ocupación geométrica de diseño, usando diámetros exteriores del cable e incluyendo todos los conductores. Se informan diámetros interiores, con mínimos diferenciados de terminal y alimentador. No se deduce una medida comercial nominal.

## Cargas desde el dibujo

Tocar una toma, o su botón Carga / circuito, permite elegir TUG, TUE o carga dedicada. TUE/dedicada guarda nombre, potencia eléctrica absorbida en W y factor de potencia; VA = W/fp e IB = VA/U. No usa potencia térmica/frigorífica ni impone una simultaneidad menor a uno. La carga aparece rotulada y conserva una boca de mano de obra: el profesional revisa trabajos adicionales del equipo.

Se separa de TUG, se computa en el alimentador y participa del agrupamiento y los conductores del camino dibujado. Los calibres son discretos y el motor conserva IB ≤ In ≤ Iz corregida. Si no hay calibre/sección en el rango o camino dibujado, queda pendiente; no elimina silenciosamente la carga.

Los cálculos nuevos usan el perfil `cu-pvc-iram-40-v2`: ampacidades de la ficha argentina Prysmian Superastic Jet/Flex 2020, dos cargados más PE a 40 °C. Se conserva el perfil inicial `cu-pvc-b1-v1` de dibujos previos. Cambiar el perfil es explícito. El factor adicional nunca incrementa la capacidad por encima de la referencia; agrupamiento sigue aplicándose. Esto no cubre cables enterrados, otras aislaciones ni materiales automáticamente.

## Cortocircuito y protecciones

Cada TP/TG/TS admite Icc máxima, Icc mínima fase-neutro, origen de esos datos y módulos reales del gabinete. No se propaga ni se inventa la impedancia entre tableros. Los terminales usan datos de su tablero; el alimentador usa los del TP. Sin referencia del origen, los chequeos de Icc quedan pendientes. Una Icc mínima mayor que la máxima se rechaza.

La estimación mínima al extremo usa una suma escalar conservadora de impedancia de origen y lazo resistivo caliente: 0,8 U / (U/Icc mínima de origen + 2 × 23,7 × L km / S). Se compara con el extremo superior de la banda magnética B/C/D. No equivale a medir el lazo fase-PE ni verifica los tiempos de protección de personas.

Por circuito se guardan curva, referencia del modelo, Icn e I²t de catálogo. Se identifica el conjunto de puntos y calibre; un cambio de calibre no reutiliza el dato anterior. La energía queda vinculada a la Icc máxima a la que fue informada y debe reingresarse si esa Icc cambia. Cambiar modelo o curva también invalida la energía; cambiar modelo exige reingresar el poder de corte. Sin referencia del modelo no se confirman corte ni energía.

Se compara Icn con Icc máxima en origen como cota conservadora. Para cobre PVC se verifica I²t ≤ (115 S)²; el motor puede aumentar la sección por esta condición o por disparo magnético, además de corriente y caída. No asigna 3 kA ni un tiempo ficticio de 0,1 s. Selección y coordinación reales siguen requiriendo catálogo y revisión profesional.

## Cañerías y tableros

La ocupación suma la sección exterior aislada de fase, neutro, PE, retornos y viajeros, con sus cantidades por tramo. Diámetros aproximados de la ficha Prysmian citada: confirmar la familia efectivamente comprada. Se puede ingresar diámetro interior real del caño al tocar la conexión; si falta, se informa el mínimo pero la elección queda pendiente. Conductores incompletos o secciones sin datos no producen un chequeo aprobado.

El gabinete se prevé con dos módulos por térmica 2P, dos por un diferencial 2P y dos por maniobra de entrada. Los módulos extra y la reserva libre son editables. El mínimo es techo(ocupados/(1-reserva/100)); se muestra un tamaño candidato superior, a confirmar con catálogo. El 20% inicial es una hipótesis de planificación de esta interfaz, no una declaración de obligatoriedad reglamentaria. Un gabinete vacío de circuitos no recibe un tamaño inventado.

Se propone sensibilidad de 30 mA; el tipo de diferencial requiere la carga/fabricante. Solo se muestra calibre de diferencial cuando hay una protección de alimentador conocida en la propuesta. No se considera que una maniobra de entrada sin protección contra sobrecorriente pueda protegerlo. La previsión no valida coordinación, corriente condicional, disipación, IP, bornes ni disposición física.

## Materiales y compatibilidad

La revisión avanzada queda en `materials.calculation.technical`; las cargas, en el punto; el diámetro real, en la conexión. Todo queda dentro del croquis versionado y el límite previo de 80.000 bytes. No se agregan colecciones, reglas ni funciones. Los croquis antiguos conservan sus opciones y pueden activar la revisión explícitamente.

Los resultados alimentan la lista usada por Ver materiales, CSV y PDF: diámetro interior mínimo, gabinete y componentes propuestos. Los materiales generados son propuestas, nunca un kit validado. Se advierte sobre duplicados si ya se ingresaron componentes manuales. No se modifica el generador PDF ni su distribución. Como antes, los resultados se recalculan con el motor instalado al descargar; no existe snapshot independiente del resultado técnico.

## Límites pendientes

Texto completo de la edición 2026, otros destinos y trifásica; elección de productos concretos y tablas específicas de caños, radios/curvas y cajas; arranque y protecciones específicas de motores/inversores; selectividad y respaldo en cascada; jerarquías TG → TS y su propagación de impedancias; falla a tierra/tiempos de desconexión, PAT y protecciones contra sobretensiones completas; calentamiento del tablero y comprobación física de montaje. Los chequeos parciales no sustituyen estos puntos.

## Fuentes

- AEA, copia del original 770:2017: https://ingenierosdejujuy.org.ar/wp-content/uploads/2024/01/Reglamentacion-AEA-770.pdf
- AEA, catálogo y anuncios de ediciones: https://aea.org.ar/reglamentaciones/impresas/
- Prysmian Argentina, Superastic Jet/Flex, edición 2020: https://latam.prysmian.com/sites/latam.prysmian.com/files/media/documents/PRY2020_Superastic%20Jet.pdf
- Schneider Electric, método mínimo: https://www.electrical-installation.org/enwiki/Calculation_of_minimum_levels_of_short-circuit_current
- Schneider Electric, solicitación térmica y k: https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions
- Schneider Electric, curvas: https://www.se.com/nl/en/faqs/FA277439/

Pruebas: casos numéricos de cargas, mínimo TUE y exceso de capacidad, alimentadores, impedancia y disparo, Icn, energía y aumento de sección, invalidación al cambiar calibre/Icc, caños completos/incompletos/compartidos, módulos y compatibilidad; edición desde el dibujo, límites de plan y guardado de entradas; suite de regresión, build/prerender, emulador y controles de Hosting. La inspección visual usa exclusivamente un croquis ficticio sin Firebase.
