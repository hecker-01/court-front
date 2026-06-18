<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { t } from "@/i18n";
import apiService from "@/services/apiService.js";
import authService from "@/services/authService.js";
import { formatDate } from "@/utils/formatters.js";
import ErrorMessage from "@/components/ErrorMessage.vue";
import EmptyState from "@/components/EmptyState.vue";

const router = useRouter();

const requests = ref([]);
const isLoading = ref(true);
const error = ref("");
const filter = ref("");
const respondingId = ref(null);
const isReadOnly = computed(() => authService.isReadOnly());

const filters = [
  { value: "", label: "matchRequests.filterAll" },
  { value: "pending", label: "matchRequests.statusPending" },
  { value: "accepted", label: "matchRequests.statusAccepted" },
  { value: "rejected", label: "matchRequests.statusRejected" },
];

const statusBadge = (status) => {
  const map = {
    pending: "bg-status-pending-bg text-status-pending",
    accepted: "bg-status-processed-bg text-status-processed",
    rejected: "bg-danger-surface text-danger",
    cancelled: "bg-asphalt text-snow-dim",
  };
  return map[status] || "bg-asphalt text-snow-dim";
};

const statusLabel = (status) =>
  t(`matchRequests.status${status.charAt(0).toUpperCase() + status.slice(1)}`);

const fetchRequests = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    const data = await apiService.getIncomingMatchRequests(filter.value || undefined);
    requests.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to load match requests:", err);
    if (err.status === 401) {
      router.push({ name: "Login", query: { redirect: "/requests" } });
      return;
    }
    error.value =
      err.status === 500 ? t("common.serverError") : err.message || t("matchRequests.loadError");
  } finally {
    isLoading.value = false;
  }
};

const setFilter = (value) => {
  filter.value = value;
  fetchRequests();
};

const respond = async (request, status) => {
  respondingId.value = request.id;
  error.value = "";
  try {
    await apiService.respondMatchRequest(request.id, status);
    await fetchRequests();
  } catch (err) {
    console.error("Failed to respond to request:", err);
    if (err.readOnly) {
      error.value = t("readOnly.blocked");
    } else {
      error.value =
        err.status === 500 ? t("common.serverError") : err.message || t("matchRequests.respondError");
    }
  } finally {
    respondingId.value = null;
  }
};

onMounted(fetchRequests);
</script>

<template>
  <div class="min-h-[calc(100dvh-var(--nav-h))] py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <div class="mb-6 pt-4">
        <h1
          class="bg-gradient-to-r from-snow to-snow-dim bg-clip-text text-4xl font-extrabold tracking-tight text-transparent"
        >
          {{ $t("matchRequests.title") }}
        </h1>
        <p class="text-snow-dim text-sm mt-2">{{ $t("matchRequests.subtitle") }}</p>
      </div>

      <!-- Filter tabs -->
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="
            filter === f.value
              ? 'bg-violet-grad shadow-glow-sm'
              : 'border border-white/10 bg-white/5 text-snow-dim hover:text-snow'
          "
          @click="setFilter(f.value)"
        >
          {{ $t(f.label) }}
        </button>
      </div>

      <div v-if="isLoading" class="glass-card divide-y divide-white/5 animate-pulse">
        <div v-for="n in 4" :key="n" class="flex items-center gap-3 px-4 py-4">
          <div class="h-9 w-9 rounded-full bg-asphalt-light"></div>
          <div class="space-y-2">
            <div class="h-4 w-40 rounded bg-asphalt-light"></div>
            <div class="h-3 w-24 rounded bg-asphalt-light"></div>
          </div>
        </div>
      </div>

      <ErrorMessage
        v-else-if="error && requests.length === 0"
        :title="$t('matchRequests.loadError')"
        :message="error"
        :retry-label="$t('common.tryAgain')"
        @retry="fetchRequests"
      />

      <EmptyState
        v-else-if="requests.length === 0"
        icon="inbox"
        :title="$t('matchRequests.empty')"
        :message="$t('matchRequests.subtitle')"
      />

      <div v-else class="space-y-3">
        <ErrorMessage
          v-if="error"
          :title="$t('matchRequests.respondError')"
          :message="error"
          :retry-label="$t('common.dismiss')"
          retry-icon="times"
          @retry="error = ''"
        />

        <div class="glass-card divide-y divide-white/5">
          <div
            v-for="req in requests"
            :key="req.id"
            class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-asphalt-light text-sm font-semibold uppercase text-snow"
            >
              {{ (req.requestedByUsername || "?").charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-snow">
                {{ $t("matchRequests.from", { name: req.requestedByUsername }) }}
              </p>
              <p class="text-xs text-snow-dim">
                {{ $t("matchRequests.forGame", { game: req.gameName }) }}
                · {{ formatDate(req.createdAt) }}
              </p>
              <p v-if="req.message" class="mt-1 text-sm italic text-snow-dim">
                "{{ req.message }}"
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <template v-if="req.status === 'pending'">
                <button
                  class="rounded-lg bg-turf px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-turf-hover disabled:opacity-50"
                  :disabled="respondingId === req.id || isReadOnly"
                  @click="respond(req, 'accepted')"
                >
                  <font-awesome-icon icon="check" class="mr-1" />
                  {{ respondingId === req.id ? $t("matchRequests.accepting") : $t("matchRequests.accept") }}
                </button>
                <button
                  class="rounded-lg bg-asphalt-light px-3 py-1.5 text-xs font-semibold text-snow transition-colors hover:text-danger disabled:opacity-50"
                  :disabled="respondingId === req.id || isReadOnly"
                  @click="respond(req, 'rejected')"
                >
                  <font-awesome-icon icon="times" class="mr-1" />
                  {{ $t("matchRequests.reject") }}
                </button>
              </template>
              <span
                v-else
                class="rounded-full px-3 py-1 text-xs font-medium capitalize"
                :class="statusBadge(req.status)"
              >
                {{ statusLabel(req.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
