import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase";
import { waitForAuth } from "../firebase/session";
import { updateSeo } from '../services/seo';
import { createAuthGuard } from "./guard";
import { ensureAccountReady } from '../services/accountProvisioning';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/aviso-legal", component: () => import("../views/LegalView.vue"), props: { kind: "notice" } },
    { path: "/seguridad", component: () => import("../views/LegalView.vue"), props: { kind: "security" } },
    { path: "/gestiones", component: () => import("../views/LegalView.vue"), props: { kind: "requests" } },
    { path: "/condiciones", component: () => import("../views/LegalView.vue"), props: { kind: "conditions" } },
    { path: "/privacidad", component: () => import("../views/LegalView.vue"), props: { kind: "privacy" } },
    { path: "/planes", name: "planes", component: () => import("../views/PlansView.vue"), meta: { auth: true } },
    { path: "/proyectos", name: "proyectos", component: () => import("../views/ProjectsView.vue"), meta: { auth: true } },
    { path: "/proyectos/:projectId/editar", name: "editar-proyecto", component: () => import("../views/DashboardView.vue"), props: true, meta: { auth: true } },
    ...[
      ["/ingresar", "login"], ["/registrarse", "register"], ["/recuperar", "recovery"],
    ].map(([path, authMode]) => ({ path, name: authMode, component: () => import("../views/AuthView.vue"), meta: { authMode } })),
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/config",
      name: "config",
      component: () => import("../views/ConfigView.vue"),
      meta: {
        auth: true,
      }
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: {
        auth: true,
      }
    },
    { path: "/mispresupuestos", redirect: "/proyectos" },
  ],
});

router.beforeEach(createAuthGuard(auth, waitForAuth, ensureAccountReady));

router.afterEach(to => updateSeo(to));

export default router;
