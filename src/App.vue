<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Nav from "./components/Nav.vue";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import ReadOnlyBanner from "./components/ReadOnlyBanner.vue";
import authService from "./services/authService.js";
import { useBranding } from "./composables/useBranding.js";

const router = useRouter();
const route = useRoute();
const isInitialLoad = ref(true);

// Read-only (inactive org) banner — reactive to login/logout and to 403
// read-only errors surfaced by apiService.
const isReadOnly = ref(authService.isReadOnly());
const refreshReadOnly = () => {
  isReadOnly.value = authService.isReadOnly();
};
// A 403 read-only response is authoritative: the org is inactive even if our
// stored status said otherwise (e.g. it wasn't returned at login).
const onReadOnlyError = () => {
  authService.updateOrg({ status: "inactive" });
  refreshReadOnly();
};

const showBanner = computed(
  () => isReadOnly.value && route.name !== "NotFound",
);

let stopBranding;

onMounted(() => {
  stopBranding = useBranding();
  window.addEventListener("org:changed", refreshReadOnly);
  window.addEventListener("org:read-only", onReadOnlyError);
});

onUnmounted(() => {
  stopBranding?.();
  window.removeEventListener("org:changed", refreshReadOnly);
  window.removeEventListener("org:read-only", onReadOnlyError);
});

router.isReady().then(() => {
  setTimeout(() => {
    isInitialLoad.value = false;
  }, 100);
});
</script>

<template>
  <div class="min-h-screen pb-20 md:pb-28" :class="{ 'pt-10': showBanner }">
    <ReadOnlyBanner v-if="showBanner" />
    <div
      v-if="route.name !== 'NotFound'"
      class="fixed right-4 top-4 z-50"
    >
      <LanguageSwitcher />
    </div>
    <router-view v-slot="{ Component, route }">
      <Transition :name="isInitialLoad ? '' : 'page'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
    <Nav />
  </div>
</template>

<style>
.page-enter-active {
  transition: all 0.3s ease-out;
}

.page-leave-active {
  transition: all 0.25s ease-in;
}

.page-enter-from {
  opacity: 0;
  /* transform: translateX(20px); */
}

.page-leave-to {
  opacity: 0;
  /* transform: translateX(-20px); */
}

:root {
  --nav-h: 5rem;
}
@media (min-width: 768px) {
  :root {
    --nav-h: 7rem;
  }
}
</style>
