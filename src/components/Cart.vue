<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  getCart,
  setCartItem,
  removeFromCart,
  clearCart,
} from "@/services/cartService";
import api from "@/services/apiService";
import { BASE_URL } from "@/services/apiService";
import authService from "@/services/authService";

const emit = defineEmits(["close", "update"]);
const router = useRouter();

const cart = ref([]);
const dishes = ref([]);
const loading = ref(true);

const cartItems = computed(() => {
  return cart.value
    .map((item) => {
      const dish = dishes.value.find((d) => d.DishID === item.dishId);
      return dish
        ? {
            ...dish,
            quantity: item.quantity,
            subtotal: dish.Price * item.quantity,
          }
        : null;
    })
    .filter((item) => item !== null);
});

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const totalItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0);
});

const loadCart = async () => {
  loading.value = true;
  try {
    cart.value = getCart();

    // Fetch all dishes to get details
    const data = await api.getDishes();
    if (Array.isArray(data)) {
      dishes.value = data;
    } else if (data && Array.isArray(data.data)) {
      dishes.value = data.data;
    } else if (data && Array.isArray(data.dishes)) {
      dishes.value = data.dishes;
    }
  } catch (error) {
    console.error("Error loading cart:", error);
  } finally {
    loading.value = false;
  }
};

const updateQuantity = (dishId, newQuantity) => {
  if (newQuantity <= 0) {
    removeItem(dishId);
  } else {
    setCartItem(dishId, newQuantity);
    cart.value = getCart();
    emit("update");
  }
};

const removeItem = (dishId) => {
  removeFromCart(dishId);
  cart.value = getCart();
  emit("update");
};

const clearAllCart = () => {
  clearCart();
  cart.value = [];
  emit("update");
};

const checkout = () => {
  // Check if user is logged in
  if (!authService.isAuthenticated()) {
    // Close cart and redirect to login with redirect back to checkout
    emit("close");
    router.push({ name: "Login", query: { redirect: "/checkout" } });
  } else {
    // User is logged in, proceed to checkout
    emit("close");
    router.push({ name: "Checkout" });
  }
};

const getImageUrl = (dish) => {
  return dish.Image ? BASE_URL + dish.Image : null;
};

onMounted(() => {
  loadCart();
});

// Watch for cart updates from outside
watch(
  () => getCart(),
  () => {
    cart.value = getCart();
  },
);
</script>

<template>
  <!-- Overlay: mobile = full-screen sheet, md+ = centered modal -->
  <div
    class="fixed inset-0 bg-black/50 z-[1000] flex items-stretch justify-center md:items-center md:p-4"
    @click="$emit('close')"
  >
    <!-- Container: mobile = full viewport, md+ = constrained modal -->
    <div
      class="bg-charcoal flex flex-col shadow-2xl w-full h-screen max-h-screen md:rounded-2xl md:max-w-[600px] md:h-auto md:max-h-[90vh]"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-asphalt-light">
        <h2 class="text-2xl font-semibold text-snow">Your Cart</h2>
        <button
          class="bg-transparent border-0 text-2xl text-snow-dim cursor-pointer p-2 flex items-center justify-center transition-colors duration-200 hover:text-snow"
          @click="$emit('close')"
          aria-label="Close cart"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="text-center py-12 px-4 text-snow-dim">Loading cart...</div>

        <div v-else-if="cartItems.length === 0" class="text-center py-12 px-4 text-snow-dim">
          <p>Your cart is empty</p>
          <p class="text-sm mt-2">
            Add some delicious dishes to get started!
          </p>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div
            v-for="item in cartItems"
            :key="item.DishID"
            class="flex gap-4 p-4 bg-asphalt rounded-xl border border-asphalt-light"
          >
            <div class="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-charcoal">
              <img
                v-if="getImageUrl(item)"
                :src="getImageUrl(item)"
                :alt="item.Name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-asphalt">
                <img src="/favicon.svg" alt="No image" class="w-2/5 h-2/5 opacity-30" />
              </div>
            </div>

            <div class="flex-1 flex flex-col gap-2">
              <h3 class="text-base font-semibold text-snow m-0">{{ item.Name }}</h3>
              <p class="text-sm text-snow-dim m-0">${{ item.Price.toFixed(2) }} each</p>

              <div class="flex items-center gap-4 mt-auto">
                <div class="flex items-center gap-2 bg-charcoal border border-asphalt-light rounded-lg p-1">
                  <button
                    class="bg-transparent border-0 w-7 h-7 flex items-center justify-center cursor-pointer text-racket rounded transition-colors duration-200 hover:bg-asphalt-light"
                    @click="updateQuantity(item.DishID, item.quantity - 1)"
                    aria-label="Decrease quantity"
                  >
                    <font-awesome-icon icon="minus" />
                  </button>
                  <span class="text-base font-medium min-w-[2rem] text-center text-snow">{{ item.quantity }}</span>
                  <button
                    class="bg-transparent border-0 w-7 h-7 flex items-center justify-center cursor-pointer text-racket rounded transition-colors duration-200 hover:bg-asphalt-light"
                    @click="updateQuantity(item.DishID, item.quantity + 1)"
                    aria-label="Increase quantity"
                  >
                    <font-awesome-icon icon="plus" />
                  </button>
                </div>

                <button
                  class="bg-transparent border-0 text-danger cursor-pointer p-2 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
                  @click="removeItem(item.DishID)"
                  aria-label="Remove item"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </div>

            <div class="text-base font-semibold text-racket flex items-center flex-shrink-0">
              ${{ item.subtotal.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer: mobile = no radius, md+ = rounded bottom -->
      <div v-if="cartItems.length > 0" class="border-t border-asphalt-light p-6 bg-court md:rounded-b-2xl">
        <div class="mb-4">
          <div class="flex justify-between items-center text-lg font-semibold text-snow">
            <span>Total ({{ totalItems }} items):</span>
            <span class="text-racket text-2xl">${{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Actions: stacked on mobile, side-by-side from sm breakpoint up -->
        <div class="flex gap-4 flex-col sm:flex-row">
          <button
            class="flex-1 py-[0.875rem] px-6 bg-asphalt text-snow-dim border border-asphalt-light rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-asphalt-light hover:text-snow"
            @click="clearAllCart"
          >
            <font-awesome-icon icon="trash-alt" />
            <span>Clear Cart</span>
          </button>
          <button
            class="flex-1 py-[0.875rem] px-6 bg-racket text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-racket-hover hover:-translate-y-0.5 hover:shadow-lg"
            @click="checkout"
          >
            <font-awesome-icon icon="shopping-cart" />
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
