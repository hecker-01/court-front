<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import { BASE_URL } from "@/services/apiService";
import Dish from "@/components/Dish.vue";
import ErrorMessage from '@/components/ErrorMessage.vue'

const route = useRoute();
const dish = ref(null);
const allDishes = ref([]);
const isLoading = ref(true);
const error = ref("");
const isAddingToCart = ref(false);
const quantity = ref(1);

const dishId = route.params.id;

const imageUrl = computed(() => {
  if (!dish.value?.Image) return null;

  // If it's already a full URL (starts with http), use it as-is
  if (dish.value.Image.startsWith("http")) {
    return dish.value.Image;
  }

  // Otherwise, prepend BASE_URL
  return BASE_URL + dish.value.Image;
});

const fetchDish = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    const response = await apiService.getDishById(dishId);
    dish.value = response.dish || response;
  } catch (err) {
    console.error("Failed to fetch dish:", err);
    error.value = err.message || "Failed to load dish details";
  } finally {
    isLoading.value = false;
  }
};

const fetchAllDishes = async () => {
  try {
    const response = await apiService.getDishes();
    allDishes.value = response.dishes || response;
  } catch (err) {
    console.error("Failed to fetch dishes:", err);
  }
};

const recommendedDishes = () => {
  return allDishes.value
    .filter((d) => d.DishID !== parseInt(dishId))
    .slice(0, 4);
};

const increaseQuantity = () => {
  quantity.value++;
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const addToCart = () => {
  const existingItem = getCartItem(dish.value.DishID);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  setCartItem(dish.value.DishID, currentQuantity + quantity.value);

  // Show feedback
  isAddingToCart.value = true;
  setTimeout(() => {
    isAddingToCart.value = false;
  }, 600);
};

onMounted(() => {
  fetchDish();
  fetchAllDishes();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="bg-charcoal shadow rounded-lg p-8">
        <div class="animate-pulse space-y-6">
          <div class="h-64 bg-asphalt-light rounded"></div>
          <div class="space-y-3">
            <div class="h-8 bg-asphalt-light rounded w-1/3"></div>
            <div class="h-4 bg-asphalt-light rounded"></div>
            <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <ErrorMessage
        v-else-if="error"
        title="Error loading dish"
        :message="error"
        hint="We couldn't load this dish. It may no longer be available."
        retry-label="Try again"
        @retry="fetchDish"
      />

      <!-- Dish Details -->
      <div v-else-if="dish" class="space-y-8">
        <!-- Dish Image and Info -->
        <div class="bg-charcoal shadow rounded-lg overflow-hidden">
          <div class="md:flex">
            <div class="md:w-1/2">
              <div class="relative">
                <img
                  v-if="imageUrl"
                  :src="imageUrl"
                  :alt="dish.Name"
                  class="w-full h-64 md:h-96 object-cover"
                  draggable="false"
                />
                <div
                  v-else
                  class="flex items-center justify-center h-64 md:h-96 bg-asphalt"
                >
                  <div class="text-center">
                    <img
                      src="/favicon.svg"
                      alt="No image"
                      class="w-16 h-16 mx-auto opacity-50 filter grayscale"
                      draggable="false"
                    />
                    <p class="mt-2 text-asphalt-muted">No Image</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="md:w-1/2 p-6 md:p-8">
              <h1 class="text-3xl font-bold text-snow mb-4">
                {{ dish.Name }}
              </h1>
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-snow-dim mb-2">
                  Ingredients
                </h2>
                <p class="text-snow-dim leading-relaxed">
                  {{ dish.Ingredients }}
                </p>
              </div>

              <div class="flex items-center justify-between mb-4">
                <span class="text-2xl font-bold text-turf"
                  >${{ dish.Price?.toFixed(2) }}</span
                >
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 bg-charcoal border border-asphalt-light rounded-lg p-1">
                  <button
                    class="bg-transparent border-0 w-8 h-8 flex items-center justify-center cursor-pointer text-racket rounded transition-colors duration-200 hover:bg-asphalt-light disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="decreaseQuantity"
                    :disabled="quantity <= 1"
                    aria-label="Decrease quantity"
                  >
                    <font-awesome-icon icon="minus" />
                  </button>
                  <span class="text-[1.1rem] font-semibold min-w-[2.5rem] text-center text-snow">{{ quantity }}</span>
                  <button
                    class="bg-transparent border-0 w-8 h-8 flex items-center justify-center cursor-pointer text-racket rounded transition-colors duration-200 hover:bg-asphalt-light disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="increaseQuantity"
                    aria-label="Increase quantity"
                  >
                    <font-awesome-icon icon="plus" />
                  </button>
                </div>

                <button
                  class="px-4 py-2 bg-racket text-white border-0 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap min-w-[110px] hover:bg-racket-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="{ 'bg-turf scale-95': isAddingToCart }"
                  :disabled="isAddingToCart"
                  @click="addToCart"
                >
                  <span v-if="!isAddingToCart" class="flex items-center justify-center gap-2">
                    <font-awesome-icon icon="shopping-cart" />
                    <span>Add to Cart</span>
                  </span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <font-awesome-icon icon="check" />
                    <span>Added!</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- You May Also Like -->
        <div
          v-if="recommendedDishes().length > 0"
          class="bg-charcoal shadow rounded-lg p-6"
        >
          <h2 class="text-2xl font-bold text-snow mb-6">
            You May Also Like
          </h2>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-6 overflow-visible">
            <Dish
              v-for="recommendedDish in recommendedDishes()"
              :key="recommendedDish.DishID"
              :dish="recommendedDish"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

