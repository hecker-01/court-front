<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from '@/components/ErrorMessage.vue'

const router = useRouter();
const isLoading = ref(true);
const orders = ref([]);
const error = ref("");

const fetchOrders = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    // Get current user to fetch their orders
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error("User not found");
    }

    // Fetch user's orders
    const response = await apiService.getOrders();
    orders.value = response.orders || response || [];

    // Update unpaid orders status in localStorage
    const hasUnpaid = orders.value.some(
      (order) => !order.Paid && order.Paid !== true,
    );
    localStorage.setItem("hasUnpaidOrders", hasUnpaid.toString());
    localStorage.setItem("lastUnpaidOrderCheck", Date.now().toString());
    window.dispatchEvent(new Event("unpaidOrdersUpdated"));
  } catch (err) {
    console.error("Failed to fetch orders:", err);

    // If 401, token is invalid - redirect to login
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      await authService.logout();
      router.push({ name: "Login", query: { redirect: "/orders" } });
      return;
    } else if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load orders";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-snow mb-8 text-center">
        Your Orders
      </h1>

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-charcoal rounded-lg p-6 animate-pulse"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="h-6 bg-asphalt-light rounded w-1/4 mb-2"></div>
              <div class="h-4 bg-asphalt-light rounded w-1/3"></div>
            </div>
            <div class="h-6 bg-asphalt-light rounded w-20"></div>
          </div>
          <div class="space-y-2">
            <div class="h-4 bg-asphalt-light rounded w-full"></div>
            <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <ErrorMessage
        v-else-if="error"
        title="Error loading orders"
        :message="error"
        hint="We couldn't load your order history. Please try again."
        retry-label="Try again"
        @retry="fetchOrders"
      />

      <!-- Empty State -->
      <div
        v-else-if="orders.length === 0"
        class="bg-charcoal rounded-lg p-12 text-center"
      >
        <svg
          class="mx-auto h-12 w-12 text-asphalt-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-snow">No orders yet</h3>
        <p class="mt-1 text-sm text-asphalt-muted">
          Start ordering delicious ramen!
        </p>
        <div class="mt-6">
          <button
            @click="router.push('/')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-racket hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket"
          >
            <font-awesome-icon icon="home" class="mr-2" />
            Browse Menu
          </button>
        </div>
      </div>

      <!-- Orders List -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.OrderID || order.id"
          class="bg-charcoal rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-snow">
                Order #{{ order.OrderID || order.id }}
              </h3>
              <p class="text-sm text-asphalt-muted">
                {{
                  new Date(
                    order.Ordered_at || order.createdAt,
                  ).toLocaleDateString()
                }}
              </p>
            </div>
            <span
              class="px-3 py-1 text-sm font-semibold rounded-full"
              :class="{
                'bg-status-pending-bg text-status-pending':
                  order.Status === 'ordered' || order.status === 'pending',
                'bg-status-processing-bg text-status-processing':
                  order.Status === 'processing' || order.status === 'preparing',
                'bg-status-completed-bg text-status-completed':
                  order.Status === 'completed' || order.status === 'completed',
                'bg-status-cancelled-bg text-status-cancelled':
                  order.Status === 'cancelled' || order.status === 'cancelled',
              }"
            >
              {{ order.Status || order.status }}
            </span>
          </div>
          <div class="border-t pt-4">
            <p class="text-sm text-snow-dim">
              Items: {{ order.items?.length || 0 }}
            </p>
            <p class="text-sm text-snow-dim mt-1" v-if="order.delivery_address">
              Delivery: {{ order.delivery_address }}
            </p>
            <div class="flex justify-between items-center mt-3">
              <span
                class="text-sm font-medium"
                :class="order.Paid ? 'text-status-completed' : 'text-danger'"
              >
                {{ order.Paid ? "Paid" : "Unpaid" }}
              </span>
              <button
                @click="router.push(`/orders/${order.OrderID || order.id}`)"
                class="text-sm font-medium text-racket hover:text-racket-hover inline-flex items-center"
              >
                <font-awesome-icon icon="eye" class="mr-1" />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
