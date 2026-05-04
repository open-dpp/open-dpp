<script lang="ts" setup>
import { ref } from "vue";
import NavigationDrawer from "../components/presentation/NavigationDrawer.vue";
import Navbar from "../components/presentation/Navbar.vue";

const drawerVisible = ref(false);
</script>

<template>
  <div class="min-h-screen bg-gray-50/50">
    <div class="sticky top-0 z-10">
      <Navbar :drawer-visible="drawerVisible" @toggle-menu="drawerVisible = !drawerVisible" />
    </div>
    <main class="mx-auto max-w-5xl px-4 sm:px-8 lg:px-12">
      <router-view />
    </main>
    <NavigationDrawer v-model="drawerVisible" />
  </div>
</template>
