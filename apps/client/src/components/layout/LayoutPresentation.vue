<script lang="ts" setup>
import { ref } from "vue";
import NavigationDrawer from "../presentation/NavigationDrawer.vue";
import Navbar from "./Navbar.vue";

const drawerVisible = ref(false);
</script>

<template>
  <div>
    <div class="xl:max-w-7xl mx-auto relative">
      <div class="flex flex-col gap-5">
        <div class="sticky top-0 z-10">
          <Navbar @toggle-menu="drawerVisible = !drawerVisible" />
        </div>
        <div class="bg-white shadow-sm">
          <main>
            <div class="px-4 sm:px-6 lg:px-8">
              <router-view />
            </div>
          </main>
        </div>
      </div>
    </div>
    <NavigationDrawer v-model="drawerVisible" />
  </div>
</template>
