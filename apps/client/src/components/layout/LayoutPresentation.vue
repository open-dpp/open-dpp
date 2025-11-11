<script lang="ts" setup>
import Footer from "./Footer.vue";
import Navbar from "./Navbar.vue";
</script>

<template>
  <div>
    <div class="xl:max-w-7xl mx-auto relative">
      <div class="flex flex-col gap-5">
        <div class="sticky top-0 z-10">
          <Navbar />
        </div>
        <div class="bg-white shadow-sm">
          <main>
            <div class="px-4 sm:px-6 lg:px-8">
              <router-view />
            </div>
          </main>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </div>
  </div>
</template>
