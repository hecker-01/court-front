<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import EmptyState from "@/components/EmptyState.vue";
import EloChart from "@/components/EloChart.vue";
import HistoryGameItem from "@/components/HistoryGameItem.vue";

const router = useRouter();
const isLoading = ref(true);
const games = ref([]);
const error = ref("");
const eloData = ref(null);

const currentUserId = authService.getCurrentUser()?.id;
const activeFilter = ref("all");

const statusOrder = { started: 0, ended: 1, processed: 2 };

const sortedGames = computed(() => {
  return [...games.value].sort((a, b) => {
    const orderA = statusOrder[a.status?.toLowerCase()] ?? 3;
    const orderB = statusOrder[b.status?.toLowerCase()] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    // Within same status group, sort by startedAt descending (newest first)
    const dateA = new Date(a.startedAt || 0);
    const dateB = new Date(b.startedAt || 0);
    return dateB - dateA;
  });
});

const filteredGames = computed(() => {
  if (activeFilter.value === "all") return sortedGames.value;
  return sortedGames.value.filter(
    (g) => g.status?.toLowerCase() === activeFilter.value,
  );
});

const filterTabs = computed(() => {
  const counts = { all: games.value.length, started: 0, ended: 0, processed: 0 };
  games.value.forEach((g) => {
    const s = g.status?.toLowerCase();
    if (counts[s] !== undefined) counts[s]++;
  });
  return [
    { key: "all", label: "All", count: counts.all },
    { key: "started", label: "Started", count: counts.started },
    { key: "ended", label: "Ended", count: counts.ended },
    { key: "processed", label: "Processed", count: counts.processed },
  ];
});

const fetchGames = async () => {
  try {
    isLoading.value = true;
    error.value = "";

    const response = await apiService.getHistoricalGames();
    games.value = response.games || response || [];
  } catch (err) {
    console.error("Failed to fetch games:", err);

    if (
      err.status === 401 ||
      err.message?.includes("401") ||
      err.message?.includes("Unauthorized")
    ) {
      await authService.logout();
      router.push({ name: "Login", query: { redirect: "/history" } });
      return;
    } else if (err.status === 500) {
      error.value = "Something went wrong. Please try again later.";
    } else {
      error.value = err.message || "Failed to load game history";
    }
  } finally {
    isLoading.value = false;
  }
};

const fetchEloHistory = async () => {
  try {
    const response = await apiService.getHistoricalElo();
    eloData.value = response;
  } catch (err) {
    console.error("Failed to fetch ELO history:", err);
  }
};

onMounted(() => {
  fetchGames();
  fetchEloHistory();
});
</script>

<template>
  <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-snow mb-2 text-center">
        Game History
      </h1>
      <p v-if="!isLoading && !error && games.length" class="text-sm text-asphalt-muted text-center mb-6">
        {{ games.length }} games played
      </p>

      <!-- ELO History Chart -->
      <EloChart v-if="eloData" :elo-data="eloData" class="mb-8" />
      <div v-else-if="!error" class="bg-charcoal rounded-lg p-6 mb-8 animate-pulse">
        <div class="h-7 bg-asphalt-light rounded w-1/4 mb-4"></div>
        <div class="h-64 bg-asphalt-light rounded"></div>
      </div>

      <!-- Filter Tabs -->
      <div v-if="!isLoading && !error && games.length" class="flex gap-2 mb-6">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          @click="activeFilter = tab.key"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="activeFilter === tab.key
            ? 'bg-racket text-white'
            : 'bg-asphalt text-snow-dim hover:bg-asphalt-light hover:text-snow'"
        >
          {{ tab.label }}
          <span
            class="ml-2 px-2 py-0.5 text-xs rounded-full"
            :class="activeFilter === tab.key ? 'bg-racket-hover' : 'bg-asphalt-light'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

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
        title="Error loading games"
        :message="error"
        hint="We couldn't load your game history. Please try again."
        retry-label="Try again"
        @retry="fetchGames"
      />

      <!-- Empty State -->
      <EmptyState
        v-else-if="games.length === 0"
        icon="clipboard-list"
        title="No games played yet."
        message="Join a game and start competing!"
        action-label="Browse Games"
        action-icon="home"
        @action="router.push('/')"
      />

      <!-- Games List -->
      <div v-else class="space-y-4">
        <HistoryGameItem
          v-for="game in filteredGames"
          :key="game.id"
          :game="game"
          :current-user-id="currentUserId"
          @navigate="(id) => router.push(`/history/${id}`)"
        />

        <!-- No results for filter -->
        <div v-if="filteredGames.length === 0" class="text-center py-8">
          <p class="text-sm text-asphalt-muted">No {{ activeFilter }} games found.</p>
        </div>
      </div>
    </div>
  </div>
</template>
