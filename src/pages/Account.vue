<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";

const router = useRouter();
const isLoading = ref(true);
const user = ref(null);
const error = ref("");
const isEditing = ref(false);
const showDeleteConfirm = ref(false);
const editForm = ref({
  username: "",
  email: "",
  phone_number: "",
});

const fetchUserData = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error("User not found");
    }

    const response = await apiService.getUserById(currentUser.id);
    user.value = response.user || response;

    // Initialize edit form
    editForm.value = {
      username: user.value.username || user.value.name || "",
      email: user.value.email || "",
      phone_number: user.value.phone_number || "",
    };
  } catch (err) {
    console.error("Failed to fetch user data:", err);

    // If 401, token is invalid - redirect to login
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      await authService.logout();
      router.push({ name: "Login", query: { redirect: "/account" } });
      return;
    } else if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load account information";
    }
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateProfile = async () => {
  try {
    error.value = "";
    const currentUser = authService.getCurrentUser();

    await apiService.updateUser(currentUser.id, editForm.value);

    // Refresh user data
    await fetchUserData();
    isEditing.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
    error.value = err.message || "Failed to update profile";
  }
};

const handleLogout = async () => {
  try {
    await authService.logout();
    router.push({ name: "Home" });
  } catch (err) {
    console.error("Logout failed:", err);
    // Still redirect even if logout fails
    router.push({ name: "Home" });
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  if (user.value) {
    editForm.value = {
      username: user.value.username || user.value.name || "",
      email: user.value.email || "",
      phone_number: user.value.phone_number || "",
    };
  }
};

const handleDeleteAccount = async () => {
  try {
    const currentUser = authService.getCurrentUser();
    await apiService.deleteUser(currentUser.id);

    // Clear user data and redirect to home
    await authService.logout();
    router.push({ name: "Home" });
  } catch (err) {
    console.error("Failed to delete account:", err);
    error.value = err.message || "Failed to delete account";
  } finally {
    showDeleteConfirm.value = false;
  }
};

const isAdmin = () => {
  return user.value?.role === "admin";
};

onMounted(() => {
  fetchUserData();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-snow text-center">
          Account Settings
        </h1>
      </div>

      <!-- Loading Skeleton -->
      <div
        v-if="isLoading"
        class="bg-charcoal shadow rounded-lg p-6 animate-pulse"
      >
        <div class="space-y-6">
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-asphalt-light rounded w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-asphalt-light rounded w-full"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-asphalt-light rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <ErrorMessage
        v-else-if="error && !user"
        title="Error loading account"
        :message="error"
        hint="We couldn't load your profile. Please try again."
        retry-label="Try again"
        @retry="fetchUserData"
      />

      <!-- Account Information -->
      <div v-else-if="user">
        <div class="bg-charcoal shadow rounded-lg">
          <!-- View Mode -->
          <div v-if="!isEditing" class="p-6">
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-snow"
                  >Username</label
                >
                <p class="mt-1 text-lg text-snow">
                  {{ user.username || user.name || "N/A" }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-snow"
                  >Email</label
                >
                <p class="mt-1 text-lg text-snow">
                  {{ user.email || "N/A" }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-snow"
                  >Phone Number</label
                >
                <p class="mt-1 text-lg text-snow">
                  {{ user.phone_number || "Not set" }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-snow"
                  >Account Type</label
                >
                <p class="mt-1">
                  <span
                    class="px-3 py-1 text-sm font-semibold rounded-full bg-asphalt-light text-racket border border-racket"
                  >
                    {{ user.role || "User" }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="p-6">
            <form @submit.prevent="handleUpdateProfile" class="space-y-6">
              <ErrorMessage
                v-if="error"
                title="Update failed"
                :message="error"
                hint="Your changes couldn't be saved. Please try again."
                retry-label="Dismiss"
                retry-icon="times"
                @retry="error = ''"
              />

              <div>
                <label
                  for="username"
                  class="block text-sm font-medium text-snow"
                  >Username <span class="text-danger">*</span></label
                >
                <input
                  id="username"
                  v-model="editForm.username"
                  type="text"
                  required
                  class="mt-1 block w-full px-3 py-2 bg-asphalt text-snow border border-asphalt-light rounded-md shadow-sm focus:outline-none focus:ring-racket focus:border-racket"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-snow"
                  >Email <span class="text-danger">*</span></label
                >
                <input
                  id="email"
                  v-model="editForm.email"
                  type="email"
                  required
                  class="mt-1 block w-full px-3 py-2 bg-asphalt text-snow border border-asphalt-light rounded-md shadow-sm focus:outline-none focus:ring-racket focus:border-racket"
                />
              </div>

              <div>
                <label
                  for="phone_number"
                  class="block text-sm font-medium text-snow"
                  >Phone Number</label
                >
                <input
                  id="phone_number"
                  v-model="editForm.phone_number"
                  type="tel"
                  class="mt-1 block w-full px-3 py-2 bg-asphalt text-snow border border-asphalt-light rounded-md shadow-sm focus:outline-none focus:ring-racket focus:border-racket"
                />
              </div>

              <div class="flex gap-3 pt-4 border-t border-asphalt-light">
                <button
                  type="submit"
                  class="flex-1 sm:flex-none px-6 py-2 bg-racket text-white font-medium rounded-md hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket flex items-center justify-center gap-2"
                >
                  <font-awesome-icon icon="save" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  @click="cancelEdit"
                  class="flex-1 sm:flex-none px-6 py-2 bg-asphalt-light text-snow font-medium rounded-md hover:bg-asphalt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-asphalt-light flex items-center justify-center gap-2"
                >
                  <font-awesome-icon icon="times" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Action Buttons Below Card -->
        <div v-if="!isEditing" class="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            @click="isEditing = true"
            class="w-full sm:flex-1 px-6 py-2 bg-asphalt-light text-snow font-medium rounded-md hover:bg-asphalt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-asphalt-light flex items-center justify-center gap-2"
          >
            <font-awesome-icon icon="edit" />
            <span>Edit Profile</span>
          </button>
          <button
            @click="handleLogout"
            class="w-full sm:flex-1 px-6 py-2 bg-charcoal hover:bg-asphalt text-danger font-medium rounded-md ring-2 ring-danger focus:ring-2 focus:ring-offset-2 focus:ring-danger flex items-center justify-center gap-2"
          >
            <font-awesome-icon icon="sign-out-alt" />
            <span>Logout</span>
          </button>
          <button
            @click="showDeleteConfirm = true"
            :disabled="isAdmin()"
            :class="[
              'w-full sm:flex-1 px-6 py-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2',
              isAdmin()
                ? 'bg-asphalt-light text-asphalt-muted cursor-not-allowed'
                : 'bg-racket text-white hover:bg-racket-hover focus:ring-racket',
            ]"
            :title="
              isAdmin()
                ? 'Admins cannot delete their own account'
                : 'Delete account'
            "
          >
            <font-awesome-icon icon="trash-alt" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-court/80 flex items-center justify-center z-[100]"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-charcoal rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-medium text-snow mb-4">Delete Account</h3>
          <p class="text-sm text-snow-dim mb-6">
            Are you sure you want to delete your account? This action cannot be
            undone and all your data will be permanently removed.
          </p>
          <div class="flex gap-3 justify-end">
            <button
              @click="showDeleteConfirm = false"
              class="px-4 py-2 bg-asphalt-light text-snow font-medium rounded-md hover:bg-asphalt"
            >
              Cancel
            </button>
            <button
              @click="handleDeleteAccount"
              class="px-4 py-2 bg-racket text-white font-medium rounded-md hover:bg-racket-hover"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
