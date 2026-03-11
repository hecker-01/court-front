<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/apiService";
import Dish from "@/components/Dish.vue";
import ErrorMessage from '@/components/ErrorMessage.vue'

const dishes = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchDishes = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await api.getDishes();
    console.log("Fetched dishes:", data);

    // Handle different response structures
    if (Array.isArray(data)) {
      dishes.value = data;
    } else if (data && Array.isArray(data.data)) {
      dishes.value = data.data;
    } else if (data && Array.isArray(data.dishes)) {
      dishes.value = data.dishes;
    } else {
      console.warn("Unexpected data structure:", data);
      dishes.value = [];
    }

    console.log("Processed dishes:", dishes.value);
  } catch (err) {
    if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to fetch dishes";
    }
    console.error("Error fetching dishes:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDishes();
});
</script>

<template>
  <div class="p-8">
    <h1 class="text-center mb-8 text-3xl font-bold">Our Menu</h1>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 mt-8 overflow-visible">
      <div
        v-for="n in 6"
        :key="n"
        class="bg-charcoal shadow rounded-lg overflow-hidden animate-pulse"
      >
        <div class="w-full h-48 bg-asphalt-light"></div>
        <div class="p-4 space-y-3">
          <div class="h-6 bg-asphalt-light rounded w-3/4"></div>
          <div class="h-4 bg-asphalt-light rounded w-full"></div>
          <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
          <div class="flex justify-between items-center mt-4">
            <div class="h-6 bg-asphalt-light rounded w-20"></div>
            <div class="h-10 bg-asphalt-light rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <ErrorMessage
      v-else-if="error"
      title="Error loading dishes"
      :message="error"
      hint="Something went wrong loading the menu. Check your connection and try again."
      retry-label="Try again"
      @retry="fetchDishes"
      class="max-w-2xl mx-auto"
    />

    <div v-else-if="dishes.length === 0" class="text-center p-8 text-lg">
      <p>No dishes available at the moment.</p>
    </div>
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 mt-8 overflow-visible">
      <Dish v-for="dish in dishes" :key="dish.DishID" :dish="dish" />
    </div>
  </div>
</template>

