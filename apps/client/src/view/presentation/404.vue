<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <main
    class="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8"
  >
    <div class="text-center">
      <p class="text-base font-semibold text-indigo-600">404</p>
      <h1
        class="mt-4 text-3xl font-semibold tracking-tight text-balance text-gray-900"
      >
        {{ t("presentation.passportNotFound") }}
      </h1>
      <p
        class="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8"
      >
        {{ t("presentation.passportNotFoundLong") }}
      </p>
    </div>
  </main>
</template>
