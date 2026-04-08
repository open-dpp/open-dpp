<script lang="ts" setup>
import { ref } from "vue";
import NavigationDrawer from "../presentation/NavigationDrawer.vue";
import Navbar from "./Navbar.vue";

const drawerVisible = ref(false);
</script>

<template>
  <div class="bg-gray-50/50 min-h-screen">
    <div class="sticky top-0 z-10">
      <Navbar :drawer-visible="drawerVisible" @toggle-menu="drawerVisible = !drawerVisible" />
    </div>
    <main class="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
      <router-view />
    </main>
    <NavigationDrawer v-model="drawerVisible" />
  </div>
</template>
