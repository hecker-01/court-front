<script setup>
import { computed } from "vue";

const props = defineProps({
  participants: {
    type: Array,
    required: true,
  },
  winnerUserId: {
    type: Number,
    default: null,
  },
});

const sortedParticipants = computed(() => {
  if (!props.participants) return [];
  return [...props.participants].sort((a, b) => b.score - a.score);
});
</script>

<template>
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
            :class="participant.userId === winnerUserId ? 'bg-status-completed-bg' : ''"
          >
            <td class="py-3 text-sm text-snow-dim w-16">
              #{{ index + 1 }}
            </td>
            <td class="py-3 text-sm font-medium text-snow">
              <span class="flex items-center gap-2">
                {{ participant.username }}
                <font-awesome-icon v-if="participant.userId === winnerUserId" icon="trophy" class="text-ball" />
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
</template>
