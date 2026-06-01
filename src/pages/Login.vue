<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
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
    error.value = "Please enter both email and password";
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    await authService.login(email.value, password.value);

    // Trigger unpaid orders check
    localStorage.removeItem("lastUnpaidOrderCheck");
    window.dispatchEvent(new Event("unpaidOrdersUpdated"));

    // Redirect to the page they tried to access or home
    const redirectTo = router.currentRoute.value.query.redirect || "/";
    router.push(redirectTo);
  } catch (err) {
    // Check for different error types
    if (err.message.includes("429") || err.message.includes("rate limit")) {
      error.value = "Rate limited. Please try again later.";
    } else if (
      err.message.includes("401") ||
      err.message.includes("Invalid credentials")
    ) {
      error.value = "Invalid email or password. Please try again.";
    } else if (err.message.includes("500")) {
      error.value = "Something went wrong. Please try again later.";
    } else if (
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError")
    ) {
      error.value = err.message || "Login failed. Please try again.";
    } else {
      error.value = err.message || "Login failed. Please try again.";
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
          Welcome back
        </h2>
        <p class="mt-2 text-sm text-snow-dim">
          Sign in to track your games and ranking.
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
            label="Email"
            type="email"
            :required="true"
            :disabled="isLoading"
            placeholder="Email address"
          />
          <FormInput
            id="password"
            v-model="password"
            label="Password"
            type="password"
            :required="true"
            :disabled="isLoading"
            placeholder="Password"
          />
        </div>

        <ErrorMessage
          v-if="error"
          title="Login failed"
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
            <span>{{ isLoading ? "Signing in..." : "Sign in" }}</span>
          </button>

          <p class="text-center text-sm text-snow-dim">
            Or
            <router-link
              to="/signup"
              class="font-semibold text-racket hover:text-racket-hover"
            >
              create a new account
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
