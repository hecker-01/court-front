import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";
import History from "@/pages/History.vue";
import GameDetails from "@/pages/GameDetails.vue";
import HistoryDetails from "@/pages/HistoryDetails.vue";
import Account from "@/pages/Account.vue";
import Login from "@/pages/Login.vue";
import Signup from "@/pages/Signup.vue";
import NotFound from "@/pages/NotFound.vue";
import authService from "@/services/authService.js";
import appConfig from "@/config/appConfig.js";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { title: `Home • ${appConfig.name}` },
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: `Login • ${appConfig.name}` },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { title: `Sign Up • ${appConfig.name}` },
  },
  {
    path: "/history",
    name: "History",
    component: History,
    meta: {
      title: `History • ${appConfig.name}`,
      requiresAuth: true,
    },
  },
  {
    path: "/history/:id",
    name: "HistoryDetails",
    component: HistoryDetails,
    meta: {
      title: `History Details • ${appConfig.name}`,
      requiresAuth: true,
    },
  },
  {
    path: "/details/:id",
    name: "GameDetails",
    component: GameDetails,
    meta: { title: `Game Details • ${appConfig.name}` },
  },
  {
    path: "/account",
    name: "Account",
    component: Account,
    meta: {
      title: `Account • ${appConfig.name}`,
      requiresAuth: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
    meta: { title: `404 Not Found • ${appConfig.name}` },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || appConfig.name;

  // Check if the route requires authentication
  if (to.meta.requiresAuth) {
    // Only check if user data exists in localStorage (not validating token)
    // Token validation happens via HTTP-only cookies on API calls
    if (!authService.isAuthenticated()) {
      // No user data, redirect to login
      next({
        name: "Login",
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // If going to login page and already logged in, redirect to account or intended destination
  if (to.name === "Login" && authService.isAuthenticated()) {
    const redirectTo = to.query.redirect || "/account";
    next(redirectTo);
    return;
  }

  next();
});

export default router;
