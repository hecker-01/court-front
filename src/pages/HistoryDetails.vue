<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import GameScoreboard from "@/components/GameScoreboard.vue";
import GameInfoGrid from "@/components/GameInfoGrid.vue";
import { formatDate, getStatusClasses } from "@/utils/formatters.js";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const game = ref(null);
const error = ref("");

const gameId = route.params.id;

const fetchGameDetails = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const response = await apiService.getHistoricalGameById(gameId);
    game.value = response;
  } catch (err) {
    console.error("Failed to fetch game details:", err);

    if (
      err.status === 401 ||
      err.message?.includes("401") ||
      err.message?.includes("Unauthorized")
    ) {
      if (!authService.isAuthenticated()) {
        await authService.logout();
        router.push({ name: "Login", query: { redirect: route.fullPath } });
        return;
      } else {
        error.value = "Game not found";
      }
    } else if (err.status === 404) {
      error.value = "Game not found";
    } else if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load game details";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchGameDetails();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Back Button -->
      <button
        @click="router.push('/history')"
        class="mb-6 inline-flex items-center text-sm font-medium text-snow-dim hover:text-snow"
      >
        <font-awesome-icon icon="arrow-left" class="mr-2" />
        Back to Game History
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-6">
        <div class="bg-charcoal rounded-lg p-8">
          <div class="animate-pulse space-y-6">
            <div class="h-8 bg-asphalt-light rounded w-1/3"></div>
            <div class="space-y-3">
              <div class="h-4 bg-asphalt-light rounded"></div>
              <div class="h-4 bg-asphalt-light rounded w-5/6"></div>
              <div class="h-4 bg-asphalt-light rounded w-4/6"></div>
            </div>
          </div>
        </div>
        <div class="bg-charcoal rounded-lg p-8">
          <div class="animate-pulse space-y-4">
            <div class="h-6 bg-asphalt-light rounded w-1/4"></div>
            <div class="h-4 bg-asphalt-light rounded w-full"></div>
            <div class="h-4 bg-asphalt-light rounded w-full"></div>
            <div class="h-4 bg-asphalt-light rounded w-3/4"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <ErrorMessage
        v-else-if="error"
        title="Error loading game"
        :message="error"
        hint="We couldn't load this game. Try again or go back to your game history."
      >
        <template #actions>
          <button
            v-if="error !== 'Game not found'"
            @click="fetchGameDetails"
            class="text-sm font-medium text-danger hover:text-racket inline-flex items-center"
          >
            <font-awesome-icon icon="redo" class="mr-1" />
            Try again
          </button>
          <button
            @click="router.push('/history')"
            class="text-sm font-medium text-danger hover:text-racket inline-flex items-center"
          >
            <font-awesome-icon icon="trophy" class="mr-1" />
            View all games
          </button>
        </template>
      </ErrorMessage>

      <!-- Game Details -->
      <div v-else-if="game" class="space-y-6">
        <!-- Game Header -->
        <div class="bg-charcoal rounded-lg p-6">
          <div class="flex justify-between items-start mb-4">
            <h1 class="text-3xl font-bold text-snow">
              {{ game.name }}
            </h1>
            <span
              class="px-4 py-2 text-sm font-semibold rounded-lg capitalize"
              :class="getStatusClasses(game.status)"
            >
              {{ game.status }}
            </span>
          </div>

          <p v-if="game.description" class="text-snow-dim mb-6">
            {{ game.description }}
          </p>

          <div class="border-t border-asphalt-light pt-4">
            <GameInfoGrid :game="game" :columns="3" />
          </div>
        </div>

        <!-- Scoreboard -->
        <GameScoreboard
          :participants="game.participants"
          :winner-user-id="game.winnerUserId"
        />
      </div>
    </div>
  </div>
</template>
