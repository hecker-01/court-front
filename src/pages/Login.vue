<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";

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
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-snow">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-snow-dim">
          Or
          <router-link
            to="/signup"
            class="font-medium text-racket hover:text-racket-hover"
          >
            create a new account
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-t-md focus:outline-none focus:ring-racket focus:border-racket focus:z-10 sm:text-sm"
              placeholder="Email address"
              :disabled="isLoading"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-b-md focus:outline-none focus:ring-racket focus:border-racket focus:z-10 sm:text-sm"
              placeholder="Password"
              :disabled="isLoading"
            />
          </div>
        </div>

        <ErrorMessage v-if="error" title="Login failed" :message="error" hint="Double-check your email and password and try again." />

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-racket hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isLoading"
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <font-awesome-icon v-else icon="sign-in-alt" />
            <span>{{ isLoading ? "Signing in..." : "Sign in" }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
