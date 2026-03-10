<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-charcoal text-white shadow-md"
    :class="{ hidden: route.name === 'NotFound' }"
  >
    <ul class="flex justify-around items-center py-3">
      <li>
        <router-link
          to="/"
          class="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-gray-400 hover:text-white"
          :class="{
            'text-white': route.name === 'Home',
          }"
        >
          <font-awesome-icon icon="house" class="text-2xl" />
          <span class="text-xs">Home</span>
        </router-link>
      </li>

      <li>
        <router-link
          to="/History"
          class="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-gray-400 hover:text-white"
          :class="{
            'text-white': route.name === 'History',
          }"
        >
          <font-awesome-icon icon="chart-line" class="text-2xl" />
          <span class="text-xs">History</span>
        </router-link>
      </li>

      <li>
        <router-link
          to="/account"
          class="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-gray-400 hover:text-white"
          :class="{
            'text-white': route.name === 'Account',
          }"
        >
          <font-awesome-icon icon="user-circle" class="text-2xl" />
          <span class="text-xs">Account</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>
