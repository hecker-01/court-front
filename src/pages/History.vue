<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import EloChart from "@/components/EloChart.vue";

const router = useRouter();
const isLoading = ref(true);
const games = ref([]);
const error = ref("");
const eloData = ref(null);

const currentUserId = authService.getCurrentUser()?.id;
const activeFilter = ref("all");

const statusBorderColors = {
  started: "#f59e0b",
  ended: "#a78bfa",
  processed: "#34d399",
};

const filteredGames = computed(() => {
  if (activeFilter.value === "all") return games.value;
  return games.value.filter(
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

const getStatusClasses = (status) => {
  const map = {
    planned: "bg-status-processing-bg text-status-processing",
    started: "bg-status-pending-bg text-status-pending",
    ended: "bg-status-delivering-bg text-status-delivering",
    processed: "bg-status-completed-bg text-status-completed",
  };
  return map[status?.toLowerCase()] || "bg-asphalt text-snow-dim";
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
      <div
        v-else-if="games.length === 0"
        class="bg-charcoal rounded-lg p-12 text-center"
      >
        <font-awesome-icon icon="clipboard-list" class="mx-auto h-12 w-12 text-asphalt-muted" />
        <h3 class="mt-2 text-sm font-medium text-snow">
          No games played yet.
        </h3>
        <p class="mt-1 text-sm text-asphalt-muted">
          Join a game and start competing!
        </p>
        <div class="mt-6">
          <button
            @click="router.push('/')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-racket hover:bg-racket-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-racket"
          >
            <font-awesome-icon icon="home" class="mr-2" />
            Browse Games
          </button>
        </div>
      </div>

      <!-- Games List -->
      <div v-else class="space-y-4">
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="bg-charcoal rounded-lg overflow-hidden hover:bg-asphalt transition-colors cursor-pointer border-l-4"
          :style="{ borderLeftColor: statusBorderColors[game.status?.toLowerCase()] || '#6b6b6b' }"
          @click="router.push(`/history/${game.id}`)"
        >
          <div class="p-6">
            <!-- Top row: name + status badge -->
            <div class="flex justify-between items-center">
              <h3 class="text-snow font-semibold">{{ game.name }}</h3>
              <span
                class="px-3 py-1 text-sm font-semibold rounded-full capitalize"
                :class="getStatusClasses(game.status)"
              >
                {{ game.status }}
              </span>
            </div>

            <!-- Middle row: description -->
            <p
              v-if="game.description"
              class="text-sm text-snow-dim line-clamp-2 mt-1"
            >
              {{ game.description }}
            </p>

            <!-- Bottom row -->
            <div class="flex justify-between items-center border-t border-asphalt-light pt-3 mt-3">
              <div class="flex items-center gap-4 flex-wrap">
                <span class="text-xs text-asphalt-muted inline-flex items-center gap-1">
                  <font-awesome-icon icon="calendar-days" />
                  {{ formatDate(game.endedAt || game.startedAt) }}
                </span>
                <span
                  v-if="game.userScore != null"
                  class="text-sm text-snow-dim"
                >
                  Score: <span class="font-semibold text-snow">{{ game.userScore }}</span>
                </span>
              </div>

              <span
                v-if="game.winnerUserId && currentUserId"
                class="text-sm font-semibold inline-flex items-center gap-1"
                :class="game.winnerUserId === currentUserId ? 'text-status-completed' : 'text-danger'"
              >
                <font-awesome-icon :icon="game.winnerUserId === currentUserId ? 'trophy' : 'circle-xmark'" />
                {{ game.winnerUserId === currentUserId ? "Win" : "Loss" }}
              </span>
            </div>
          </div>
        </div>

        <!-- No results for filter -->
        <div v-if="filteredGames.length === 0" class="text-center py-8">
          <p class="text-sm text-asphalt-muted">No {{ activeFilter }} games found.</p>
        </div>
      </div>
    </div>
  </div>
</template>
