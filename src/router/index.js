import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase";
import { waitForAuth } from "../firebase/session";
import { createAuthGuard } from "./guard";
import { ensureAccountReady } from '../services/accountProvisioning';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    {
      path: "/mispresupuestos",
      name: "mispresupuestos",
      component: () => import("../views/MisPresupuestos.vue"),
      meta: {
        auth: true,
      }
    },
  ],
});

router.beforeEach(createAuthGuard(auth, waitForAuth, ensureAccountReady));

export default router;
