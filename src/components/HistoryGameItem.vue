<script setup>
import { formatDate, getStatusClasses, getStatusBorderColor } from "@/utils/formatters.js";

const props = defineProps({
  game: { type: Object, required: true },
  currentUserId: { type: Number, default: null },
});

const emit = defineEmits(["navigate"]);
</script>

<template>
  <div
    class="bg-charcoal rounded-lg overflow-hidden hover:bg-asphalt transition-colors cursor-pointer border-l-4"
    :style="{ borderLeftColor: getStatusBorderColor(game.status) }"
    @click="emit('navigate', game.id)"
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

      <!-- Description -->
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
            {{ formatDate(game.startedAt) || "Unknown" }}
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
</template>
