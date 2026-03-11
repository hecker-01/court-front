<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";

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
    error.value = "Please fill in all required fields";
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }

  if (formData.value.password.length < 6) {
    error.value = "Password must be at least 6 characters";
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

    // Clear any existing unpaid orders data for new user
    localStorage.removeItem("hasUnpaidOrders");
    localStorage.removeItem("lastUnpaidOrderCheck");

    // Redirect to login page after successful signup
    router.push({
      name: "Login",
      query: { message: "Account created successfully! Please sign in." },
    });
  } catch (err) {
    // Check for different error types
    if (err.message.includes("429") || err.message.includes("rate limit")) {
      error.value = "Rate limited. Please try again later.";
    } else if (err.message.includes("400")) {
      error.value = "Invalid information provided. Please check your details.";
    } else if (err.message.includes("500")) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value =
        err.message || "Failed to create account. Please try again.";
    }
    console.error("Signup error:", err);
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
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-snow-dim">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-racket hover:text-racket-hover"
          >
            Sign in
          </router-link>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSignup">
        <div class="space-y-4">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-snow-dim"
              >Username <span class="text-danger">*</span></label
            >
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-md focus:outline-none focus:ring-racket focus:border-racket sm:text-sm"
              placeholder="Username"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-snow-dim"
              >Email <span class="text-danger">*</span></label
            >
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-md focus:outline-none focus:ring-racket focus:border-racket sm:text-sm"
              placeholder="Email address"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="phone_number"
              class="block text-sm font-medium text-snow-dim"
              >Phone Number</label
            >
            <input
              id="phone_number"
              v-model="formData.phone_number"
              type="tel"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-md focus:outline-none focus:ring-racket focus:border-racket sm:text-sm"
              placeholder="Phone Number"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-snow-dim"
              >Password <span class="text-danger">*</span></label
            >
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-md focus:outline-none focus:ring-racket focus:border-racket sm:text-sm"
              placeholder="Password (min 6 characters)"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-snow-dim"
              >Confirm Password <span class="text-danger">*</span></label
            >
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-asphalt-light placeholder-asphalt-muted text-snow bg-asphalt rounded-md focus:outline-none focus:ring-racket focus:border-racket sm:text-sm"
              placeholder="Confirm Password"
              :disabled="isLoading"
            />
          </div>
        </div>

        <ErrorMessage v-if="error" title="Signup failed" :message="error" hint="Please review your details and try again." />

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
            <font-awesome-icon v-else icon="user-plus" />
            <span>{{ isLoading ? "Creating account..." : "Sign up" }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
