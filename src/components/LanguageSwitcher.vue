<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { SUPPORTED_LOCALES, setLocale } from "@/i18n";

const { locale, t } = useI18n();

const isOpen = ref(false);
const root = ref(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const select = (code) => {
  setLocale(code);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (root.value && !root.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside),
);
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full border border-white/10 bg-charcoal/80 px-3 py-2 text-sm font-medium text-snow-dim shadow-card backdrop-blur-xl transition-colors hover:text-snow"
      :aria-label="t('language.label')"
      @click="toggle"
    >
      <font-awesome-icon icon="globe" />
      <span class="uppercase">{{ locale }}</span>
    </button>

    <ul
      v-if="isOpen"
      class="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-charcoal/95 py-1 shadow-card backdrop-blur-xl"
    >
      <li v-for="option in SUPPORTED_LOCALES" :key="option.code">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-white/5"
          :class="locale === option.code ? 'text-snow' : 'text-snow-dim'"
          @click="select(option.code)"
        >
          {{ option.label }}
          <font-awesome-icon
            v-if="locale === option.code"
            icon="check"
            class="text-xs text-racket"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
