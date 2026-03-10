<script setup></script>

<template>
  <div
    class="flex flex-col items-center justify-center h-screen text-center px-4"
  >
    <h1 class="text-6xl font-bold text-gray-800 mb-4">404</h1>
    <p class="text-xl text-gray-600 mb-8">Page Not Found</p>
    <router-link
      to="/"
      class="px-6 py-3 bg-torii text-white rounded-lg hover:bg-torii-hover transition-colors"
    >
      Go Back Home
    </router-link>
  </div>
</template>

<style scoped></style>
