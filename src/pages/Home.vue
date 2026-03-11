<script setup>
import { ref, onMounted } from "vue";
import apiService from "@/services/apiService.js";
import GameCard from "@/components/GameCard.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";

const games = ref([]);
const isLoading = ref(true);
const error = ref("");

const fetchGames = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    const data = await apiService.getGames();
    games.value = Array.isArray(data) ? data : data.games || [];
  } catch (err) {
    console.error("Failed to fetch games:", err);
    if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load games";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchGames();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-snow mb-8 text-center">
        Upcoming Games
      </h1>

      <!-- Skeleton Loading -->
      <div
        v-if="isLoading"
        class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 overflow-visible"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="bg-charcoal rounded-lg border border-asphalt-light overflow-hidden animate-pulse"
        >
          <div class="p-6 space-y-3">
            <div class="flex justify-between items-start">
              <div class="h-6 bg-asphalt-light rounded w-3/4"></div>
              <div class="h-5 bg-asphalt-light rounded-full w-16"></div>
            </div>
            <div class="h-4 bg-asphalt-light rounded w-full"></div>
            <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
            <div class="flex justify-between items-center mt-4">
              <div class="h-4 bg-asphalt-light rounded w-28"></div>
              <div class="h-4 bg-asphalt-light rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <ErrorMessage
        v-else-if="error"
        title="Error loading games"
        :message="error"
        hint="Something went wrong loading the games. Check your connection and try again."
        retry-label="Try again"
        @retry="fetchGames"
        class="max-w-2xl mx-auto"
      />

      <!-- Empty State -->
      <div
        v-else-if="games.length === 0"
        class="bg-charcoal rounded-lg p-12 text-center"
      >
        <h3 class="text-sm font-medium text-snow">
          No games available at the moment.
        </h3>
        <p class="mt-1 text-sm text-asphalt-muted">
          Check back later for upcoming games!
        </p>
      </div>

      <!-- Games Grid -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 overflow-visible"
      >
        <GameCard v-for="game in games" :key="game.id" :game="game" />
      </div>
    </div>
  </div>
</template>

