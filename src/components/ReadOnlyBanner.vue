<template>
  <div
    class="fixed inset-x-0 top-0 z-40 border-b border-status-pending/30 bg-status-pending-bg/95 backdrop-blur-md"
  >
    <div
      class="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm"
    >
      <font-awesome-icon icon="lock" class="text-status-pending" />
      <span class="font-medium text-status-pending">
        {{ $t("readOnly.banner") }}
      </span>
    </div>
  </div>
</template>
