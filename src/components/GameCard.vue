<script setup>
import { useRouter } from "vue-router";
import { formatDate } from "@/utils/formatters.js";

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const statusConfig = {
  planned: { label: "Planned", bg: "bg-racket/20", text: "text-racket" },
  started: { label: "Started", bg: "bg-status-pending/20", text: "text-status-pending" },
  ended: { label: "Ended", bg: "bg-status-delivering/20", text: "text-status-delivering" },
  processed: { label: "Processed", bg: "bg-status-completed/20", text: "text-status-completed" },
};

const status = statusConfig[props.game.status] || statusConfig.planned;

const viewDetails = () => {
  router.push(`/details/${props.game.id}`);
};
</script>

<template>
  <div
    class="group bg-card-bg rounded-lg border border-asphalt-light shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:border-racket hover:shadow-lg hover:-translate-y-1"
    @click="viewDetails"
  >
    <!-- Accent bar -->
    <div class="h-1 bg-racket" />

    <div class="p-6">
      <div class="flex items-start justify-between gap-3 mb-3">
        <h3 class="text-xl font-semibold text-snow">{{ game.name }}</h3>
        <span
          class="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="[status.bg, status.text]"
        >
          {{ status.label }}
        </span>
      </div>

      <p class="text-snow-dim text-sm mb-4 leading-relaxed line-clamp-2">
        {{ game.description }}
      </p>

      <div class="grid grid-cols-3 gap-2 text-sm border-t border-asphalt-light pt-4">
        <span class="text-snow-dim">
          <font-awesome-icon icon="calendar-days" class="mr-1" /> {{ formatDate(game.plannedAt) }}
        </span>
        <span class="text-snow-dim text-center">
          <font-awesome-icon icon="users" class="mr-1" /> {{ game.signupCount ?? 0 }} players
        </span>
        <span class="text-snow-dim text-right">
          <template v-if="game.averageElo != null">
            <font-awesome-icon icon="chart-line" class="mr-1" /> ~{{ game.averageElo }} ELO
          </template>
          <template v-else>—</template>
        </span>
      </div>
    </div>

    <!-- Hover chevron -->
    <div class="flex justify-end px-6 pb-4 -mt-1">
      <font-awesome-icon
        icon="chevron-right"
        class="text-asphalt-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm"
      />
    </div>
  </div>
</template>
