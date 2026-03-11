<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";
import FormInput from "@/components/FormInput.vue";

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
            <div class="h-6 bg-asphalt-light rounded w-1/2"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-6 bg-asphalt-light rounded w-2/3"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-6 bg-asphalt-light rounded w-1/3"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-10 bg-asphalt-light rounded w-1/5"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-6 bg-asphalt-light rounded w-1/4"></div>
          </div>
          <div>
            <div class="h-4 bg-asphalt-light rounded w-1/4 mb-2"></div>
            <div class="h-6 bg-asphalt-light rounded w-1/3"></div>
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
                <label class="block text-sm font-medium text-snow">Email</label>
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
                <label class="block text-sm font-medium text-snow">ELO Rating</label>
                <p class="mt-1 text-2xl font-bold text-ball">
                  {{ user.elo ?? 1000 }}
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

              <div>
                <label class="block text-sm font-medium text-snow">Member Since</label>
                <p class="mt-1 text-lg text-snow">
                  {{ user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' }}
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

              <FormInput id="username" v-model="editForm.username" label="Username" required />
              <FormInput id="email" v-model="editForm.email" label="Email" type="email" required />
              <FormInput id="phone_number" v-model="editForm.phone_number" label="Phone Number" type="tel" />

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
                : 'bg-danger text-white hover:bg-danger-hover focus:ring-danger',
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
      <DeleteConfirmModal
        :visible="showDeleteConfirm"
        @confirm="handleDeleteAccount"
        @cancel="showDeleteConfirm = false"
      />
    </div>
  </div>
</template>
