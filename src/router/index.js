import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase";
import { waitForAuth } from "../firebase/session";
import { createAuthGuard } from "./guard";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "",
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

router.beforeEach(createAuthGuard(auth, waitForAuth));

export default router;
