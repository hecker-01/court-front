<script setup>
import { onMounted, ref } from "vue";
import { t } from "@/i18n";
import apiService from "@/services/apiService.js";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const props = defineProps({
  // Currently selected org (object) — used to highlight the active entry.
  selected: { type: Object, default: null },
});

const emit = defineEmits(["select"]);

const query = ref("");
const orgs = ref([]);
const isLoading = ref(true);
const error = ref("");
let searchTimer = null;

const load = async (q = "") => {
  try {
    isLoading.value = true;
    error.value = "";
    const data = q.trim()
      ? await apiService.searchOrgs(q.trim())
      : await apiService.getOrgs();
    orgs.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to load orgs:", err);
    error.value = err.message || t("orgPicker.loadError");
  } finally {
    isLoading.value = false;
  }
};

const onInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load(query.value), 250);
};

const choose = (org) => emit("select", org);

onMounted(() => load());
</script>

<template>
  <div class="space-y-3">
    <div>
      <label
        for="org-search"
        class="block text-xs font-semibold uppercase tracking-wide text-snow-dim"
      >
        {{ $t("orgPicker.label") }}
      </label>
      <input
        id="org-search"
        v-model="query"
        type="text"
        :placeholder="$t('orgPicker.searchPlaceholder')"
        class="mt-2 block w-full rounded-xl border border-white/10 bg-asphalt/60 px-4 py-3 text-snow placeholder:text-asphalt-muted transition-all focus:border-racket focus:outline-none focus:ring-2 focus:ring-racket/30"
        @input="onInput"
      />
    </div>

    <div
      v-if="isLoading"
      class="flex items-center justify-center py-6 text-snow-dim"
    >
      <LoadingSpinner />
    </div>

    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

    <p
      v-else-if="orgs.length === 0"
      class="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-snow-dim"
    >
      {{ $t("orgPicker.noResults") }}
    </p>

    <ul v-else class="max-h-64 space-y-2 overflow-y-auto pr-1">
      <li v-for="org in orgs" :key="org.id">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
          :class="
            selected?.id === org.id
              ? 'border-racket bg-racket/10'
              : 'border-white/10 bg-asphalt/40 hover:bg-white/5'
          "
          @click="choose(org)"
        >
          <span class="flex items-center gap-3 min-w-0">
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :style="{ backgroundColor: org.accentColor || '#7c5cfc' }"
            ></span>
            <span class="truncate font-medium text-snow">{{ org.name }}</span>
          </span>
          <span
            v-if="org.status === 'inactive'"
            class="shrink-0 rounded-full bg-status-pending-bg px-2.5 py-1 text-xs font-medium text-status-pending"
          >
            {{ $t("orgPicker.readOnly") }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
