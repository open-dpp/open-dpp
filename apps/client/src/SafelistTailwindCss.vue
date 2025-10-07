<script setup lang="ts"></script>

<template>
  <!--  Ensure that the css classes are loaded for the dynamic grid. See https://tailwindcss.com/docs/detecting-classes-in-source-files -->
  <!-- grid-cols -->
  <div class="hidden">
    grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6
    grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12
    sm:grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 sm:grid-cols-4 sm:grid-cols-5
    sm:grid-cols-6 sm:grid-cols-7 sm:grid-cols-8 sm:grid-cols-9 sm:grid-cols-10
    sm:grid-cols-11 sm:grid-cols-12 md:grid-cols-1 md:grid-cols-2 md:grid-cols-3
    md:grid-cols-4 md:grid-cols-5 md:grid-cols-6 md:grid-cols-7 md:grid-cols-8
    md:grid-cols-9 md:grid-cols-10 md:grid-cols-11 md:grid-cols-12
    lg:grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5
    lg:grid-cols-6 lg:grid-cols-7 lg:grid-cols-8 lg:grid-cols-9 lg:grid-cols-10
    lg:grid-cols-11 lg:grid-cols-12 xl:grid-cols-1 xl:grid-cols-2 xl:grid-cols-3
    xl:grid-cols-4 xl:grid-cols-5 xl:grid-cols-6 xl:grid-cols-7 xl:grid-cols-8
    xl:grid-cols-9 xl:grid-cols-10 xl:grid-cols-11 xl:grid-cols-12
    2xl:grid-cols-1 2xl:grid-cols-2 2xl:grid-cols-3 2xl:grid-cols-4
    2xl:grid-cols-5 2xl:grid-cols-6 2xl:grid-cols-7 2xl:grid-cols-8
    2xl:grid-cols-9 2xl:grid-cols-10 2xl:grid-cols-11 2xl:grid-cols-12
  </div>
  <!-- col-start -->
  <div class="hidden">
    col-start-1 col-start-2 col-start-3 col-start-4 col-start-5 col-start-6
    col-start-7 col-start-8 col-start-9 col-start-10 col-start-11 col-start-12
    sm:col-start-1 sm:col-start-2 sm:col-start-3 sm:col-start-4 sm:col-start-5
    sm:col-start-6 sm:col-start-7 sm:col-start-8 sm:col-start-9 sm:col-start-10
    sm:col-start-11 sm:col-start-12 md:col-start-1 md:col-start-2 md:col-start-3
    md:col-start-4 md:col-start-5 md:col-start-6 md:col-start-7 md:col-start-8
    md:col-start-9 md:col-start-10 md:col-start-11 md:col-start-12
    lg:col-start-1 lg:col-start-2 lg:col-start-3 lg:col-start-4 lg:col-start-5
    lg:col-start-6 lg:col-start-7 lg:col-start-8 lg:col-start-9 lg:col-start-10
    lg:col-start-11 lg:col-start-12 xl:col-start-1 xl:col-start-2 xl:col-start-3
    xl:col-start-4 xl:col-start-5 xl:col-start-6 xl:col-start-7 xl:col-start-8
    xl:col-start-9 xl:col-start-10 xl:col-start-11 xl:col-start-12
    2xl:col-start-1 2xl:col-start-2 2xl:col-start-3 2xl:col-start-4
    2xl:col-start-5 2xl:col-start-6 2xl:col-start-7 2xl:col-start-8
    2xl:col-start-9 2xl:col-start-10 2xl:col-start-11 2xl:col-start-12
  </div>
  <!-- col-span -->
  <div class="hidden">
    col-span-1 col-span-2 col-span-3 col-span-4 col-span-5 col-span-6 col-span-7
    col-span-8 col-span-9 col-span-10 col-span-11 col-span-12 sm:col-span-1
    sm:col-span-2 sm:col-span-3 sm:col-span-4 sm:col-span-5 sm:col-span-6
    sm:col-span-7 sm:col-span-8 sm:col-span-9 sm:col-span-10 sm:col-span-11
    sm:col-span-12 md:col-span-1 md:col-span-2 md:col-span-3 md:col-span-4
    md:col-span-5 md:col-span-6 md:col-span-7 md:col-span-8 md:col-span-9
    md:col-span-10 md:col-span-11 md:col-span-12 lg:col-span-1 lg:col-span-2
    lg:col-span-3 lg:col-span-4 lg:col-span-5 lg:col-span-6 lg:col-span-7
    lg:col-span-8 lg:col-span-9 lg:col-span-10 lg:col-span-11 lg:col-span-12
    xl:col-span-1 xl:col-span-2 xl:col-span-3 xl:col-span-4 xl:col-span-5
    xl:col-span-6 xl:col-span-7 xl:col-span-8 xl:col-span-9 xl:col-span-10
    xl:col-span-11 xl:col-span-12 2xl:col-span-1 2xl:col-span-2 2xl:col-span-3
    2xl:col-span-4 2xl:col-span-5 2xl:col-span-6 2xl:col-span-7 2xl:col-span-8
    2xl:col-span-9 2xl:col-span-10 2xl:col-span-11 2xl:col-span-12
  </div>
  <!-- row-start -->
  <div class="hidden">
    row-start-1 row-start-2 row-start-3 row-start-4 row-start-5 row-start-6
    row-start-7 row-start-8 row-start-9 row-start-10 row-start-11 row-start-12
    sm:row-start-1 sm:row-start-2 sm:row-start-3 sm:row-start-4 sm:row-start-5
    sm:row-start-6 sm:row-start-7 sm:row-start-8 sm:row-start-9 sm:row-start-10
    sm:row-start-11 sm:row-start-12 md:row-start-1 md:row-start-2 md:row-start-3
    md:row-start-4 md:row-start-5 md:row-start-6 md:row-start-7 md:row-start-8
    md:row-start-9 md:row-start-10 md:row-start-11 md:row-start-12
    lg:row-start-1 lg:row-start-2 lg:row-start-3 lg:row-start-4 lg:row-start-5
    lg:row-start-6 lg:row-start-7 lg:row-start-8 lg:row-start-9 lg:row-start-10
    lg:row-start-11 lg:row-start-12 xl:row-start-1 xl:row-start-2 xl:row-start-3
    xl:row-start-4 xl:row-start-5 xl:row-start-6 xl:row-start-7 xl:row-start-8
    xl:row-start-9 xl:row-start-10 xl:row-start-11 xl:row-start-12
    2xl:row-start-1 2xl:row-start-2 2xl:row-start-3 2xl:row-start-4
    2xl:row-start-5 2xl:row-start-6 2xl:row-start-7 2xl:row-start-8
    2xl:row-start-9 2xl:row-start-10 2xl:row-start-11 2xl:row-start-12
  </div>
  <!-- row-span -->
  <div class="hidden">
    row-span-1 row-span-2 row-span-3 row-span-4 row-span-5 row-span-6 row-span-7
    row-span-8 row-span-9 row-span-10 row-span-11 row-span-12 sm:row-span-1
    sm:row-span-2 sm:row-span-3 sm:row-span-4 sm:row-span-5 sm:row-span-6
    sm:row-span-7 sm:row-span-8 sm:row-span-9 sm:row-span-10 sm:row-span-11
    sm:row-span-12 md:row-span-1 md:row-span-2 md:row-span-3 md:row-span-4
    md:row-span-5 md:row-span-6 md:row-span-7 md:row-span-8 md:row-span-9
    md:row-span-10 md:row-span-11 md:row-span-12 lg:row-span-1 lg:row-span-2
    lg:row-span-3 lg:row-span-4 lg:row-span-5 lg:row-span-6 lg:row-span-7
    lg:row-span-8 lg:row-span-9 lg:row-span-10 lg:row-span-11 lg:row-span-12
    xl:row-span-1 xl:row-span-2 xl:row-span-3 xl:row-span-4 xl:row-span-5
    xl:row-span-6 xl:row-span-7 xl:row-span-8 xl:row-span-9 xl:row-span-10
    xl:row-span-11 xl:row-span-12 2xl:row-span-1 2xl:row-span-2 2xl:row-span-3
    2xl:row-span-4 2xl:row-span-5 2xl:row-span-6 2xl:row-span-7 2xl:row-span-8
    2xl:row-span-9 2xl:row-span-10 2xl:row-span-11 2xl:row-span-12
  </div>
</template>
