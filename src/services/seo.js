export const SITE_URL = 'https://electricistaxpress.com.ar';
export const HOME_TITLE = 'Presupuestos eléctricos con tus precios | Electricista Xpress';
export const HOME_DESCRIPTION = 'Organizá tus trabajos, actualizá la mano de obra y prepará presupuestos eléctricos en PDF desde el celular o la computadora. Creá tu primer proyecto gratis.';
const pages = {
  '/': [HOME_TITLE, HOME_DESCRIPTION],
  '/condiciones': ['Condiciones de uso | Electricista Xpress', 'Conocé los planes, la renovación, la cancelación y el acceso a tus proyectos de Electricista Xpress.'],
  '/privacidad': ['Privacidad | Electricista Xpress', 'Cómo usamos los datos de tu cuenta y tus proyectos y cómo contactarnos sobre privacidad.'],
};
export function updateSeo(route) {
  const page = pages[route.path];
  const [title, description] = page ?? ['Mi cuenta | Electricista Xpress', 'Accedé a tu cuenta de Electricista Xpress.'];
  document.title = title;
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
