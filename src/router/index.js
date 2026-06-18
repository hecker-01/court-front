import { createRouter, createWebHistory } from "vue-router";
import authService from "@/services/authService.js";
import appConfig from "@/config/appConfig.js";

const Home = () => import("@/pages/Home.vue");
const Login = () => import("@/pages/Login.vue");
const Signup = () => import("@/pages/Signup.vue");
const Leaderboard = () => import("@/pages/Leaderboard.vue");
const History = () => import("@/pages/History.vue");
const HistoryDetails = () => import("@/pages/HistoryDetails.vue");
const GameDetails = () => import("@/pages/GameDetails.vue");
const Account = () => import("@/pages/Account.vue");
const ProfileDetails = () => import("@/pages/ProfileDetails.vue");
const MatchRequests = () => import("@/pages/MatchRequests.vue");
const NotFound = () => import("@/pages/NotFound.vue");

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { title: `Home • ${appConfig.name}`, requiresAuth: true },
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
    path: "/leaderboard",
    name: "Leaderboard",
    component: Leaderboard,
    meta: { title: `Leaderboard • ${appConfig.name}`, requiresAuth: true },
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
    meta: { title: `Game Details • ${appConfig.name}`, requiresAuth: true },
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
    path: "/profile/:id",
    name: "ProfileDetails",
    component: ProfileDetails,
    meta: {
      title: `Profile • ${appConfig.name}`,
      requiresAuth: true,
    },
  },
  {
    path: "/requests",
    name: "MatchRequests",
    component: MatchRequests,
    meta: {
      title: `Match Requests • ${appConfig.name}`,
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

  const isAuthed = authService.isAuthenticated();

  if (to.meta.requiresAuth && !isAuthed) {
    next({ name: "Login", query: { redirect: to.fullPath } });
    return;
  }

  // Already logged in and visiting a login/signup screen → go home.
  if (["Login", "Signup"].includes(to.name) && isAuthed) {
    next(to.query.redirect || "/");
    return;
  }

  next();
});

export default router;
