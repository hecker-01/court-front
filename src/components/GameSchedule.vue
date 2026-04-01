<script setup>
import { computed } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  schedule: { type: Object, required: true },
  currentUserId: { type: Number, default: null },
});

const emit = defineEmits(["player-click"]);

const rounds = computed(() => props.schedule?.rounds || []);

const mySchedule = computed(() => {
  if (!props.currentUserId || !props.schedule?.playerRounds) return null;
  return props.schedule.playerRounds.find(
    (pr) => pr.userId === props.currentUserId,
  );
});
</script>

<template>
  <div class="space-y-6">
    <!-- Your Schedule (personal view for authenticated user) -->
    <div v-if="mySchedule" class="bg-asphalt rounded-lg p-4">
      <h3
        class="text-sm font-semibold text-racket uppercase tracking-wide mb-3"
      >
        <font-awesome-icon icon="user-circle" class="mr-1.5" />
        Your Schedule
      </h3>
      <div class="grid gap-2">
        <div
          v-for="round in mySchedule.rounds"
          :key="round.round"
          class="flex items-center gap-3 bg-charcoal rounded-lg px-4 py-3"
        >
          <span
            class="text-xs font-semibold text-snow-dim uppercase w-16 shrink-0"
          >
            Round {{ round.round }}
          </span>

          <template v-if="round.isSittingOut">
            <span class="text-sm text-asphalt-muted italic"
              >Sitting out - no match</span
            >
          </template>
          <template v-else>
            <span class="text-sm text-snow-dim">Field {{ round.field }}</span>
            <span class="text-snow-dim mx-1">·</span>
            <span class="text-sm text-snow">vs</span>
            <button
              type="button"
              class="text-sm font-medium text-snow hover:text-racket transition-colors cursor-pointer"
              @click="emit('player-click', round.opponent.userId)"
            >
              {{ round.opponent.username }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Full Round-by-Round Schedule -->
    <div v-if="rounds.length">
      <h3
        class="text-sm font-semibold text-snow-dim uppercase tracking-wide mb-3"
      >
        <font-awesome-icon icon="clipboard-list" class="mr-1.5" />
        All Rounds
      </h3>

      <div class="space-y-4">
        <div
          v-for="round in rounds"
          :key="round.round"
          class="bg-asphalt rounded-lg overflow-hidden"
        >
          <!-- Round header -->
          <div class="px-4 py-2 bg-asphalt-light">
            <span
              class="text-xs font-semibold text-snow-dim uppercase tracking-wide"
            >
              Round {{ round.round }}
            </span>
          </div>

          <!-- Matches -->
          <div class="divide-y divide-asphalt-light">
            <div
              v-for="(match, idx) in round.matches"
              :key="idx"
              class="flex items-center gap-3 px-4 py-3"
            >
              <!-- Field badge -->
              <span
                class="shrink-0 w-7 h-7 rounded bg-asphalt-light flex items-center justify-center text-xs font-semibold text-snow-dim"
                title="Field number"
              >
                {{ match.field }}
              </span>

              <!-- Player A -->
              <button
                type="button"
                class="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:text-racket transition-colors"
                :class="
                  match.playerA.userId === currentUserId
                    ? 'text-racket font-semibold'
                    : 'text-snow'
                "
                @click="emit('player-click', match.playerA.userId)"
              >
                <span
                  class="w-6 h-6 rounded-full bg-asphalt-light flex items-center justify-center text-xs font-semibold uppercase shrink-0"
                  :class="
                    match.playerA.userId === currentUserId
                      ? 'text-racket'
                      : 'text-snow'
                  "
                >
                  {{ match.playerA.username?.charAt(0) || "?" }}
                </span>
                <span class="text-sm truncate">{{
                  match.playerA.username
                }}</span>
              </button>

              <!-- VS -->
              <span
                class="text-xs font-bold text-asphalt-muted uppercase shrink-0"
                >vs</span
              >

              <!-- Player B -->
              <button
                type="button"
                class="flex items-center gap-2 min-w-0 flex-1 text-right justify-end cursor-pointer hover:text-racket transition-colors"
                :class="
                  match.playerB.userId === currentUserId
                    ? 'text-racket font-semibold'
                    : 'text-snow'
                "
                @click="emit('player-click', match.playerB.userId)"
              >
                <span class="text-sm truncate">{{
                  match.playerB.username
                }}</span>
                <span
                  class="w-6 h-6 rounded-full bg-asphalt-light flex items-center justify-center text-xs font-semibold uppercase shrink-0"
                  :class="
                    match.playerB.userId === currentUserId
                      ? 'text-racket'
                      : 'text-snow'
                  "
                >
                  {{ match.playerB.username?.charAt(0) || "?" }}
                </span>
              </button>
            </div>
          </div>

          <!-- Sitting out -->
          <div
            v-for="bye in round.sittingOut"
            :key="bye.userId"
            class="flex items-center gap-3 px-4 py-3 border-t border-asphalt-light"
          >
            <span
              class="shrink-0 w-7 h-7 rounded bg-asphalt-light flex items-center justify-center text-xs font-semibold text-snow-dim"
              title="No field assigned"
            >
              -
            </span>
            <button
              type="button"
              class="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:text-racket transition-colors"
              :class="
                bye.userId === currentUserId
                  ? 'text-racket font-semibold'
                  : 'text-snow'
              "
              @click="emit('player-click', bye.userId)"
            >
              <span
                class="w-6 h-6 rounded-full bg-asphalt-light flex items-center justify-center text-xs font-semibold uppercase shrink-0"
                :class="
                  bye.userId === currentUserId ? 'text-racket' : 'text-snow'
                "
              >
                {{ bye.username?.charAt(0) || "?" }}
              </span>
              <span class="text-sm truncate">{{ bye.username }}</span>
            </button>
            <span class="text-xs text-asphalt-muted italic shrink-0"
              >Sitting out</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <p
      v-if="!rounds.length"
      class="text-sm text-asphalt-muted text-center py-4"
    >
      No schedule generated yet.
    </p>
  </div>
</template>
