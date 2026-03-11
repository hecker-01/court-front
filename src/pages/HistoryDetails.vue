<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";

const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const game = ref(null);
const error = ref("");

const gameId = route.params.id;

const getStatusClasses = (status) => {
  const map = {
    planned: "bg-status-processing-bg text-status-processing border-status-processing",
    started: "bg-status-pending-bg text-status-pending border-status-pending",
    ended: "bg-status-delivering-bg text-status-delivering border-status-delivering",
    processed: "bg-status-completed-bg text-status-completed border-status-completed",
  };
  return (
    map[status?.toLowerCase()] ||
    "bg-asphalt text-snow-dim border-asphalt-light"
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sortedParticipants = computed(() => {
  if (!game.value?.participants) return [];
  return [...game.value.participants].sort((a, b) => b.score - a.score);
});

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
              class="px-4 py-2 text-sm font-semibold rounded-lg border-2 capitalize"
              :class="getStatusClasses(game.status)"
            >
              {{ game.status }}
            </span>
          </div>

          <p
            v-if="game.description"
            class="text-snow-dim mb-6"
          >
            {{ game.description }}
          </p>

          <div class="border-t border-asphalt-light pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs font-semibold text-asphalt-muted uppercase">Planned</p>
              <p class="text-sm text-snow mt-1">{{ formatDate(game.plannedAt) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-asphalt-muted uppercase">Started</p>
              <p class="text-sm text-snow mt-1">{{ formatDate(game.startedAt) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-asphalt-muted uppercase">Ended</p>
              <p class="text-sm text-snow mt-1">{{ formatDate(game.endedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Scoreboard -->
        <div class="bg-charcoal rounded-lg p-6">
          <h2 class="text-lg font-semibold text-snow mb-4">Scoreboard</h2>

          <div v-if="sortedParticipants.length === 0" class="text-sm text-asphalt-muted text-center py-4">
            No participants recorded.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-asphalt-light">
                  <th class="pb-3 text-xs font-semibold text-asphalt-muted uppercase">Rank</th>
                  <th class="pb-3 text-xs font-semibold text-asphalt-muted uppercase">Player</th>
                  <th class="pb-3 text-xs font-semibold text-asphalt-muted uppercase text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(participant, index) in sortedParticipants"
                  :key="participant.id"
                  class="border-b border-asphalt-light last:border-b-0"
                  :class="participant.userId === game.winnerUserId ? 'bg-status-completed-bg' : ''"
                >
                  <td class="py-3 text-sm text-snow-dim w-16">
                    #{{ index + 1 }}
                  </td>
                  <td class="py-3 text-sm font-medium text-snow">
                    <span class="flex items-center gap-2">
                      {{ participant.username }}
                      <font-awesome-icon v-if="participant.userId === game.winnerUserId" icon="trophy" class="text-ball" />
                    </span>
                  </td>
                  <td class="py-3 text-sm font-semibold text-snow text-right">
                    {{ participant.score }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>