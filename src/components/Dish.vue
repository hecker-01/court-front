<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { BASE_URL } from "@/services/apiService";

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const isAddingToCart = ref(false);

const imageUrl = props.dish.Image ? BASE_URL + props.dish.Image : null;

const viewDetails = () => {
  router.push(`/details/${props.dish.DishID}`);
};

const addToCart = (event) => {
  event.stopPropagation(); // Prevent triggering viewDetails

  const existingItem = getCartItem(props.dish.DishID);
  const currentQuantity = existingItem ? existingItem.quantity : 0;
  setCartItem(props.dish.DishID, currentQuantity + 1);

  // Show feedback
  isAddingToCart.value = true;
  setTimeout(() => {
    isAddingToCart.value = false;
  }, 600);
};

console.log("Dish component received dish:", props.dish);
</script>

<template>
  <div
    class="bg-card-bg rounded-lg border border-asphalt-light shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:border-racket hover:shadow-lg"
    @click="viewDetails"
  >
    <div>
      <div class="w-full h-[200px] overflow-hidden bg-asphalt">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="dish.Name"
          class="w-full h-full object-cover"
          draggable="false"
        />
        <div v-else class="flex items-center justify-center h-full text-asphalt-muted text-base">
          <img
            src="/favicon.svg"
            alt="No image"
            class="w-[50px] h-[50px] opacity-50 grayscale"
            draggable="false"
          />
          <p class="mt-2">No Image</p>
        </div>
      </div>
    </div>
    <div class="p-6">
      <h3 class="text-xl font-semibold mb-2 text-snow">{{ dish.Name }}</h3>
      <p class="text-snow-dim text-sm mb-4 leading-relaxed line-clamp-2">{{ dish.Ingredients }}</p>
      <div class="flex justify-between items-center mt-1 gap-4">
        <span class="text-lg font-bold text-turf">${{ dish.Price?.toFixed(2) }}</span>
        <button
          class="px-4 py-2 bg-racket text-white border-0 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap min-w-[110px] hover:bg-racket-hover"
          :class="{ 'bg-turf scale-95': isAddingToCart }"
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
</template>
