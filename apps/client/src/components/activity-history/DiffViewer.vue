<script setup lang="ts"></script>

<template>
  <dl>
    <div>
      <dt class="text-sm/6 font-medium text-gray-900">Alt</dt>
      <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"><slot name="oldValue" /></dd>
    </div>
    <div>
      <dt class="text-sm/6 font-medium text-gray-900">Neu</dt>
      <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"><slot name="newValue" /></dd>
    </div>
  </dl>
</template>

<style scoped></style>
