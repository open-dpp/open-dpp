import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

// const MODE = import.meta.env.MODE;

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/404",
    component: () => import("../view/404.vue"),
  },
  {
    path: "/:permalink",
    component: () => import("../view/View.vue"),
  },
  {
    path: "/:permalink/chat",
    component: () => import("../view/Chat.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("../view/404.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
