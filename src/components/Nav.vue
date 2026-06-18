<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import authService from "@/services/authService.js";
import apiService from "@/services/apiService.js";

const route = useRoute();

// Re-evaluate auth/role reactively on navigation and session changes.
const authVersion = ref(0);
const bump = () => (authVersion.value += 1);

const isAuthed = computed(() => {
  authVersion.value; // track
  return authService.isAuthenticated();
});

const role = computed(() => {
  authVersion.value; // track
  return isAuthed.value ? authService.getRole() : null;
});

const pendingCount = ref(0);

// Users and managers share the player-facing views in this app.
const navItems = computed(() => [
  { to: "/", label: "nav.home", icon: "house", names: ["Home"] },
  {
    to: "/leaderboard",
    label: "nav.leaderboard",
    icon: "trophy",
    names: ["Leaderboard", "ProfileDetails"],
  },
  { to: "/history", label: "nav.history", icon: "chart-line", names: ["History"] },
  { to: "/requests", label: "nav.requests", icon: "inbox", names: ["MatchRequests"], badge: true },
  { to: "/account", label: "nav.account", icon: "user-circle", names: ["Account"] },
]);

const loadPending = async () => {
  if (!role.value) {
    pendingCount.value = 0;
    return;
  }
  try {
    const requests = await apiService.getIncomingMatchRequests("pending");
    pendingCount.value = Array.isArray(requests) ? requests.length : 0;
  } catch {
    pendingCount.value = 0;
  }
};

watch(
  () => route.fullPath,
  () => {
    bump();
    loadPending();
  },
);

onMounted(() => {
  window.addEventListener("org:changed", bump);
  loadPending();
});

onUnmounted(() => {
  window.removeEventListener("org:changed", bump);
});
</script>

<template>
  <nav
    v-if="isAuthed"
    class="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 pt-2"
    :class="{ hidden: route.name === 'NotFound' }"
  >
    <ul
      class="flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-white/10 bg-charcoal/80 px-3 py-2 shadow-card backdrop-blur-xl sm:px-4"
    >
      <li v-for="item in navItems" :key="item.to" class="min-w-0 flex-1">
        <router-link
          :to="item.to"
          class="group relative flex min-w-0 flex-col items-center gap-1 rounded-full px-2 py-2 transition-all duration-200"
          :class="
            item.names.includes(route.name)
              ? 'text-white'
              : 'text-snow-dim hover:text-white'
          "
        >
          <span
            class="relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
            :class="
              item.names.includes(route.name)
                ? 'bg-violet-grad shadow-glow-sm'
                : 'bg-transparent group-hover:bg-white/5'
            "
          >
            <font-awesome-icon :icon="item.icon" class="text-base sm:text-lg" />
            <span
              v-if="item.badge && pendingCount > 0"
              class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-white"
            >
              {{ pendingCount > 9 ? "9+" : pendingCount }}
            </span>
          </span>
          <span class="truncate text-[10px] font-medium leading-none sm:text-xs">{{
            $t(item.label)
          }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>
