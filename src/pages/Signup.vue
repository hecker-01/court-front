<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { t } from "@/i18n";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import FormInput from "@/components/FormInput.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import OrgPicker from "@/components/OrgPicker.vue";

const router = useRouter();
const selectedOrg = ref(null);
const formData = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone_number: "",
});
const error = ref("");
const isLoading = ref(false);

const onSelectOrg = (org) => {
  selectedOrg.value = org;
  error.value = "";
};

const handleSignup = async () => {
  error.value = "";

  if (!selectedOrg.value) {
    error.value = t("signup.errors.missingOrg");
    return;
  }

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
      orgId: selectedOrg.value.id,
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      phone_number: formData.value.phone_number || undefined,
    });

    // Auto-login with the credentials just used to register.
    await authService.login(
      selectedOrg.value.id,
      formData.value.email,
      formData.value.password,
    );

    router.push("/");
  } catch (err) {
    if (err.status === 429 || err.message.includes("rate limit")) {
      error.value = t("signup.errors.rateLimited");
    } else if (err.status === 404) {
      error.value = t("signup.errors.orgNotActive");
    } else if (err.status === 409) {
      error.value = t("signup.errors.taken");
    } else if (err.status === 400) {
      error.value = t("signup.errors.invalid");
    } else if (err.status === 500) {
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

      <!-- Step 1: pick an org -->
      <div v-if="!selectedOrg" class="glass-card space-y-5 p-7">
        <p class="text-sm text-snow-dim">{{ $t("signup.chooseOrg") }}</p>
        <OrgPicker :selected="selectedOrg" @select="onSelectOrg" />
      </div>

      <form v-else class="mt-8 space-y-6" @submit.prevent="handleSignup">
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
                >{{ $t("signup.selectedOrg") }}</span
              >
              <span class="block truncate font-medium text-snow">{{
                selectedOrg.name
              }}</span>
            </span>
          </span>
          <button
            type="button"
            class="shrink-0 text-sm font-medium text-racket hover:text-racket-hover"
            @click="selectedOrg = null"
          >
            {{ $t("signup.changeOrg") }}
          </button>
        </div>

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
            class="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-racket hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LoadingSpinner v-if="isLoading" class="text-white" />
            <font-awesome-icon v-else icon="user-plus" />
            <span>{{
              isLoading ? $t("signup.creating") : $t("signup.signUp")
            }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
