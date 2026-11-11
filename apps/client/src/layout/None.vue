<script lang="ts" setup>
import LegalLinks from "../components/legal/LegalLinks.vue";
</script>

<template>
  <div>
    <main class="h-[calc(100vh-64px)]">
      <router-view />
    </main>
    <footer class="py-4">
      <LegalLinks />
    </footer>
  </div>
</template>
