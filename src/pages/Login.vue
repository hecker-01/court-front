<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { t } from "@/i18n";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import FormInput from "@/components/FormInput.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = t("login.errors.missingFields");
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    await authService.login(email.value, password.value);

    // Redirect to the page they tried to access or home
    const redirectTo = router.currentRoute.value.query.redirect || "/";
    router.push(redirectTo);
  } catch (err) {
    // Check for different error types
    if (err.message.includes("429") || err.message.includes("rate limit")) {
      error.value = t("login.errors.rateLimited");
    } else if (
      err.message.includes("401") ||
      err.message.includes("Invalid credentials")
    ) {
      error.value = t("login.errors.invalid");
    } else if (err.message.includes("500")) {
      error.value = t("common.serverError");
    } else if (
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError")
    ) {
      error.value = err.message || t("login.errors.generic");
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
          <font-awesome-icon icon="trophy" class="text-2xl text-white" />
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight text-snow">
          {{ $t("login.title") }}
        </h2>
        <p class="mt-2 text-sm text-snow-dim">
          {{ $t("login.subtitle") }}
        </p>
      </div>

      <form
        class="glass-card space-y-6 p-7"
        @submit.prevent="handleLogin"
      >
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
          <button
            type="submit"
            :disabled="isLoading"
            class="btn-violet w-full py-3"
          >
            <LoadingSpinner v-if="isLoading" class="text-white" />
            <font-awesome-icon v-else icon="sign-in-alt" />
            <span>{{ isLoading ? $t("login.signingIn") : $t("login.signIn") }}</span>
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
