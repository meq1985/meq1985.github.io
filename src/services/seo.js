export const SITE_URL = 'https://electricistaxpress.com.ar';
export const HOME_TITLE = 'Presupuestos eléctricos con tus precios | Electricista Xpress';
export const HOME_DESCRIPTION = 'Creá presupuestos eléctricos con tus precios, organizá proyectos y descargá un PDF profesional desde el celular o la PC. Probá 30 días gratis, sin tarjeta.';
export const HOME_SCHEMA = Object.freeze({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Electricista Xpress',
  url: SITE_URL + '/', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'es-AR',
  description: 'Aplicación para electricistas independientes: presupuestos de mano de obra, precios editables, proyectos guardados, PDF profesional y croquis de obra nueva.',
});
const pages = {
  '/': [HOME_TITLE, HOME_DESCRIPTION],
  '/condiciones': ['Condiciones de uso | Electricista Xpress', 'Conocé los planes, la renovación, la cancelación y el acceso a tus proyectos de Electricista Xpress.'],
  '/aviso-legal': ['Aviso legal | Electricista Xpress', 'Identidad del responsable, contacto y alcance de Electricista Xpress en Argentina.'],
  '/seguridad': ['Seguridad y confianza | Electricista Xpress', 'Conexión HTTPS, protección de la cuenta y gestión de pagos en Electricista Xpress.'],
  '/gestiones': ['Baja y arrepentimiento | Electricista Xpress', 'Solicitá la baja o el arrepentimiento de una contratación sin iniciar sesión.'],
  '/privacidad': ['Privacidad | Electricista Xpress', 'Cómo usamos los datos de tu cuenta y tus proyectos y cómo contactarnos sobre privacidad.'],
};
export function updateSeo(route) {
  const page = pages[route.path];
  const [title, description] = page ?? (route.name === 'not-found'
    ? ['Página no encontrada | Electricista Xpress', 'El enlace no existe. Volvé al inicio de Electricista Xpress o ingresá a tus proyectos.']
    : ['Mi cuenta | Electricista Xpress', 'Accedé a tu cuenta de Electricista Xpress.']);
  document.title = title;
  let schema = document.head.querySelector('script[type="application/ld+json"]');
  if (route.path === '/') {
    if (!schema) { schema = document.createElement('script'); schema.type = 'application/ld+json'; document.head.append(schema); }
    schema.textContent = JSON.stringify(HOME_SCHEMA);
  } else schema?.remove();
  function meta(selector, attributes) {
    let element = document.head.querySelector(selector);
    if (!element) { element = document.createElement('meta'); document.head.append(element); }
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  }
  meta('meta[name="description"]', { name: 'description', content: description });
  meta('meta[name="robots"]', { name: 'robots', content: page ? 'index,follow' : 'noindex,follow' });
  for (const [property, content] of Object.entries({ 'og:title': title, 'og:description': description, 'og:url': SITE_URL + (page ? route.path : '/') })) meta(`meta[property="${property}"]`, { property, content });
  for (const [name, content] of Object.entries({ 'twitter:title': title, 'twitter:description': description })) meta(`meta[name="${name}"]`, { name, content });
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!page) { canonical?.remove(); return; }
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = SITE_URL + route.path;
}
