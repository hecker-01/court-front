<script setup>
import { onMounted, ref } from "vue";
import { t } from "@/i18n";
import apiService from "@/services/apiService.js";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const props = defineProps({
  visible: { type: Boolean, required: true },
  targetUserId: { type: [Number, String], required: true },
  targetName: { type: String, default: "" },
});

const emit = defineEmits(["close", "sent"]);

const games = ref([]);
const isLoadingGames = ref(false);
const selectedGameId = ref(null);
const message = ref("");
const isSending = ref(false);
const error = ref("");
const success = ref(false);

const loadGames = async () => {
  isLoadingGames.value = true;
  error.value = "";
  try {
    const data = await apiService.getGames();
    games.value = Array.isArray(data) ? data : data.games || [];
    if (games.value.length) selectedGameId.value = games.value[0].id;
  } catch (err) {
    console.error("Failed to load games:", err);
    error.value = err.message || t("home.loadError");
  } finally {
    isLoadingGames.value = false;
  }
};

const send = async () => {
  if (!selectedGameId.value) return;
  isSending.value = true;
  error.value = "";
  try {
    await apiService.sendMatchRequest(selectedGameId.value, {
      requestedForUserId: Number(props.targetUserId),
      message: message.value || undefined,
    });
    success.value = true;
    emit("sent");
  } catch (err) {
    console.error("Failed to send match request:", err);
    if (err.readOnly) {
      error.value = t("readOnly.blocked");
    } else if (err.status === 409) {
      error.value = t("matchRequests.conflict");
    } else {
      error.value =
        err.status === 500 ? t("common.serverError") : err.message || t("matchRequests.sendError");
    }
  } finally {
    isSending.value = false;
  }
};

onMounted(loadGames);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-court/80 px-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-md rounded-2xl bg-charcoal p-6 shadow-card">
      <h3 class="mb-4 text-lg font-semibold text-snow">
        {{ $t("matchRequests.inviteTitle", { name: targetName }) }}
      </h3>

      <div v-if="success" class="space-y-5 text-center">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-turf/15"
        >
          <font-awesome-icon icon="circle-check" class="text-2xl text-turf" />
        </div>
        <p class="text-sm text-snow">{{ $t("matchRequests.sent") }}</p>
        <button class="btn-violet w-full" @click="$emit('close')">
          {{ $t("common.dismiss") }}
        </button>
      </div>

      <form v-else class="space-y-4" @submit.prevent="send">
        <div v-if="isLoadingGames" class="flex justify-center py-6 text-snow-dim">
          <LoadingSpinner />
        </div>

        <p
          v-else-if="games.length === 0"
          class="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-snow-dim"
        >
          {{ $t("home.emptyTitle") }}
        </p>

        <template v-else>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-snow-dim">
              {{ $t("matchRequests.selectGame") }}
            </label>
            <select
              v-model="selectedGameId"
              class="mt-2 block w-full rounded-xl border border-white/10 bg-asphalt/60 px-3 py-2.5 text-snow focus:border-racket focus:outline-none focus:ring-2 focus:ring-racket/30"
            >
              <option v-for="g in games" :key="g.id" :value="g.id">
                {{ g.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-snow-dim">
              {{ $t("matchRequests.message") }}
            </label>
            <textarea
              v-model="message"
              rows="3"
              :placeholder="$t('matchRequests.messagePlaceholder')"
              class="mt-2 block w-full rounded-xl border border-white/10 bg-asphalt/60 px-3 py-2.5 text-snow placeholder:text-asphalt-muted focus:border-racket focus:outline-none focus:ring-2 focus:ring-racket/30"
            ></textarea>
          </div>
        </template>

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="submit"
            class="btn-violet flex-1"
            :disabled="isSending || isLoadingGames || games.length === 0"
          >
            <LoadingSpinner v-if="isSending" class="text-white" />
            <font-awesome-icon v-else icon="paper-plane" />
            {{ isSending ? $t("matchRequests.sending") : $t("matchRequests.send") }}
          </button>
          <button type="button" class="btn-glass" @click="$emit('close')">
            {{ $t("common.cancel") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
