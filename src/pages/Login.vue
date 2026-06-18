<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { t } from "@/i18n";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import FormInput from "@/components/FormInput.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import OrgPicker from "@/components/OrgPicker.vue";

const router = useRouter();
const selectedOrg = ref(null);
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const onSelectOrg = (org) => {
  selectedOrg.value = org;
  error.value = "";
};

const changeOrg = () => {
  selectedOrg.value = null;
};

const handleLogin = async () => {
  if (!selectedOrg.value) {
    error.value = t("login.errors.missingOrg");
    return;
  }
  if (!email.value || !password.value) {
    error.value = t("login.errors.missingFields");
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    await authService.login(selectedOrg.value.id, email.value, password.value);

    const redirectTo = router.currentRoute.value.query.redirect || "/";
    router.push(redirectTo);
  } catch (err) {
    if (err.status === 403) {
      error.value = t("login.errors.adminOnOrgLogin");
    } else if (err.status === 404) {
      error.value = t("login.errors.orgNotFound");
    } else if (err.status === 429 || err.message.includes("rate limit")) {
      error.value = t("login.errors.rateLimited");
    } else if (err.status === 401) {
      error.value = t("login.errors.invalid");
    } else if (err.status === 500) {
      error.value = t("common.serverError");
    } else {
      error.value = err.message || t("login.errors.generic");
    }
    console.error("Login error:", err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-[calc(100dvh-var(--nav-h))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-grad shadow-glow"
        >
          <font-awesome-icon icon="trophy" class="text-2xl" />
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight text-snow">
          {{ $t("login.title") }}
        </h2>
        <p class="mt-2 text-sm text-snow-dim">
          {{ selectedOrg ? $t("login.subtitle") : $t("login.chooseOrg") }}
        </p>
      </div>

      <!-- Step 1: pick an org -->
      <div v-if="!selectedOrg" class="glass-card space-y-5 p-7">
        <OrgPicker :selected="selectedOrg" @select="onSelectOrg" />
      </div>

      <!-- Step 2: credentials -->
      <form v-else class="glass-card space-y-6 p-7" @submit.prevent="handleLogin">
        <div
          class="flex items-center justify-between rounded-xl border border-white/10 bg-asphalt/40 px-4 py-3"
        >
          <span class="flex items-center gap-3 min-w-0">
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :style="{ backgroundColor: selectedOrg.accentColor || '#7c5cfc' }"
            ></span>
            <span class="min-w-0">
              <span
                class="block text-[10px] uppercase tracking-wide text-asphalt-muted"
                >{{ $t("login.selectedOrg") }}</span
              >
              <span class="block truncate font-medium text-snow">{{
                selectedOrg.name
              }}</span>
            </span>
          </span>
          <button
            type="button"
            class="shrink-0 text-sm font-medium text-racket hover:text-racket-hover"
            @click="changeOrg"
          >
            {{ $t("login.changeOrg") }}
          </button>
        </div>

        <div class="space-y-4">
          <FormInput
            id="email"
            v-model="email"
            :label="$t('login.email')"
            type="email"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('login.emailPlaceholder')"
          />
          <FormInput
            id="password"
            v-model="password"
            :label="$t('login.password')"
            type="password"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('login.passwordPlaceholder')"
          />
        </div>

        <ErrorMessage
          v-if="error"
          :title="$t('login.failedTitle')"
          :message="error"
          :hint="error"
        />

        <div class="space-y-3">
          <button type="submit" :disabled="isLoading" class="btn-violet w-full py-3">
            <LoadingSpinner v-if="isLoading" class="text-white" />
            <font-awesome-icon v-else icon="sign-in-alt" />
            <span>{{
              isLoading ? $t("login.signingIn") : $t("login.signIn")
            }}</span>
          </button>

          <p class="text-center text-sm text-snow-dim">
            {{ $t("login.or") }}
            <router-link
              to="/signup"
              class="font-semibold text-racket hover:text-racket-hover"
            >
              {{ $t("login.createAccount") }}
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
