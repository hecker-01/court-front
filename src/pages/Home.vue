<script setup>
import { ref, computed, onMounted } from "vue";
import apiService from "@/services/apiService.js";
import GameCard from "@/components/GameCard.vue";
import ErrorMessage from "@/components/ErrorMessage.vue";
import EmptyState from "@/components/EmptyState.vue";

const games = ref([]);
const isLoading = ref(true);
const error = ref("");

const sortedGames = computed(() =>
  [...games.value].sort((a, b) => {
    if (!a.plannedAt && !b.plannedAt) return 0;
    if (!a.plannedAt) return 1;
    if (!b.plannedAt) return -1;
    return new Date(a.plannedAt) - new Date(b.plannedAt);
  })
);

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

      <!-- Hero Header -->
      <div class="text-center mb-12 pt-4">
        <div class="inline-flex items-center gap-3 mb-4">
          <font-awesome-icon icon="crown" class="text-ball text-4xl sm:text-5xl drop-shadow-lg" />
          <h1 class="text-4xl sm:text-5xl font-extrabold text-snow tracking-tight">
            King of the Court
          </h1>
        </div>
        <p class="text-snow-dim text-lg max-w-xl mx-auto">
          Sign up for upcoming games and compete for the crown
        </p>

        <!-- Game count badge -->
        <div v-if="!isLoading && !error && games.length > 0" class="mt-5">
          <span class="inline-flex items-center gap-1.5 bg-racket/15 text-racket px-4 py-1.5 rounded-full text-sm font-medium">
            <font-awesome-icon icon="calendar-days" class="text-xs" />
            {{ games.length }} upcoming {{ games.length === 1 ? 'game' : 'games' }}
          </span>
        </div>
      </div>

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
          <div class="h-1 bg-asphalt-light" />
          <div class="p-6">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="h-6 bg-asphalt-light rounded w-3/4"></div>
              <div class="h-5 bg-asphalt-light rounded-full w-16"></div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="h-4 bg-asphalt-light rounded w-full"></div>
              <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
            </div>
            <div class="grid grid-cols-3 gap-2 border-t border-asphalt-light pt-4">
              <div class="h-4 bg-asphalt-light rounded w-20"></div>
              <div class="h-4 bg-asphalt-light rounded w-16 mx-auto"></div>
              <div class="h-4 bg-asphalt-light rounded w-14 ml-auto"></div>
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
      <EmptyState
        v-else-if="games.length === 0"
        icon="home"
        title="No games available right now."
        message="Check back later for upcoming games!"
        action-label="Refresh"
        action-icon="redo"
        @action="fetchGames"
      />

      <!-- Games Grid -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 overflow-visible"
      >
        <GameCard v-for="game in sortedGames" :key="game.id" :game="game" />
      </div>
    </div>
  </div>
</template>

