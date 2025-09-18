<template>
  <div>
    <div class="xl:max-w-7xl pt-10 mx-auto">
      <div class="flex flex-col gap-5">
        <div class="bg-white shadow-sm">
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

<script lang="ts" setup>
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
</script>
