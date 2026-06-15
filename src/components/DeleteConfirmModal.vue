<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: null,
  },
  message: {
    type: String,
    default: null,
  },
  confirmLabel: {
    type: String,
    default: null,
  },
});

defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-court/80 flex items-center justify-center z-[100]"
    @click.self="$emit('cancel')"
  >
    <div class="bg-charcoal rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-snow mb-4">{{ title || $t("deleteModal.title") }}</h3>
      <p class="text-sm text-snow-dim mb-6">{{ message || $t("deleteModal.message") }}</p>
      <div class="flex gap-3 justify-end">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 bg-asphalt-light text-snow font-medium rounded-md hover:bg-asphalt"
        >
          <FontAwesomeIcon icon="times" class="mr-1" />
          {{ $t("deleteModal.cancel") }}
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-2 bg-danger text-white font-medium rounded-md hover:bg-danger-hover focus:ring-danger"
        >
          <FontAwesomeIcon icon="trash-alt" class="mr-1" />
          {{ confirmLabel || $t("deleteModal.confirm") }}
        </button>
      </div>
    </div>
  </div>
</template>
