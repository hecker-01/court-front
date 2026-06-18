<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { t } from "@/i18n";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import FormInput from "@/components/FormInput.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const router = useRouter();
const formData = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone_number: "",
});
const error = ref("");
const isLoading = ref(false);

const handleSignup = async () => {
  error.value = "";

  // Validation
  if (
    !formData.value.username ||
    !formData.value.email ||
    !formData.value.password
  ) {
    error.value = t("signup.errors.required");
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = t("signup.errors.passwordMismatch");
    return;
  }

  if (formData.value.password.length < 6) {
    error.value = t("signup.errors.passwordLength");
    return;
  }

  isLoading.value = true;

  try {
    await apiService.registerUser({
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      phone_number: formData.value.phone_number,
      role: "user",
    });

    // Auto-login with the credentials just used to register
    await authService.login(formData.value.email, formData.value.password);

    router.push("/");
  } catch (err) {
    // Check for different error types
    if (err.message.includes("429") || err.message.includes("rate limit")) {
      error.value = t("signup.errors.rateLimited");
    } else if (err.message.includes("400")) {
      error.value = t("signup.errors.invalid");
    } else if (err.message.includes("500")) {
      error.value = t("common.serverError");
    } else {
      error.value = err.message || t("signup.errors.generic");
    }
    console.error("Signup error:", err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-[calc(100dvh-var(--nav-h))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-snow">
          {{ $t("signup.title") }}
        </h2>
        <p class="mt-2 text-center text-sm text-snow-dim">
          {{ $t("signup.haveAccount") }}
          <router-link
            to="/login"
            class="font-medium text-racket hover:text-racket-hover"
          >
            {{ $t("signup.signIn") }}
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSignup">
        <div class="space-y-4">
          <FormInput
            id="username"
            v-model="formData.username"
            :label="$t('signup.name')"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('signup.namePlaceholder')"
          />
          <FormInput
            id="email"
            v-model="formData.email"
            :label="$t('signup.email')"
            type="email"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('signup.emailPlaceholder')"
          />
          <FormInput
            id="phone_number"
            v-model="formData.phone_number"
            :label="$t('signup.phone')"
            type="tel"
            :disabled="isLoading"
            :placeholder="$t('signup.phonePlaceholder')"
          />
          <FormInput
            id="password"
            v-model="formData.password"
            :label="$t('signup.password')"
            type="password"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('signup.passwordPlaceholder')"
          />
          <FormInput
            id="confirmPassword"
            v-model="formData.confirmPassword"
            :label="$t('signup.confirmPassword')"
            type="password"
            :required="true"
            :disabled="isLoading"
            :placeholder="$t('signup.confirmPasswordPlaceholder')"
          />
        </div>

        <ErrorMessage
          v-if="error"
          :title="$t('signup.failedTitle')"
          :message="error"
          :hint="error"
        />

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-racket hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LoadingSpinner v-if="isLoading" class="text-white" />
            <font-awesome-icon v-else icon="user-plus" />
            <span>{{ isLoading ? $t("signup.creating") : $t("signup.signUp") }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
