import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase";

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

//navegation guards
router.beforeEach((to, from, next) => {
  if(to.path === "/" && auth.currentUser){
    next("/dashboard")
  } else if(to.matched.some((record) => record.meta.auth) && !auth.currentUser)
  {
    next("/");
  } else {
    next();
  }
});
router.beforeEach((to, from, next) => {
  if(to.path === "/" && auth.currentUser){
    next("/config")
  } else if(to.matched.some((record) => record.meta.auth) && !auth.currentUser)
  {
    next("/");
  } else {
    next();
  }
});

export default router;
