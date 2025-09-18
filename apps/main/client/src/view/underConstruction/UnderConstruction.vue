<template>
  <div>
    <div
      class="construction-container flex flex-col items-center justify-center p-8 text-center"
    >
      <div class="logo-wrapper mb-8">
        <img :src="logo" alt="Company Logo" class="w-48 h-auto logo-bounce" />
      </div>

      <h2 class="text-2xl font-bold mb-4 text-GJDarkGreen">In Arbeit!</h2>
      <p class="mb-4 text-gray-600">
        Wir arbeiten mit Hochdruck an dieser Funktionalität.
      </p>
      <a
        :href="`mailto:${email}`"
        class="inline-flex items-center px-4 py-2 bg-GJDarkGreen rounded-md hover:opacity-90 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
          />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Kontaktieren Sie uns gerne, wenn Sie Vorschläge oder Fragen haben.
      </a>
    </div>
    <div v-if="props.showPreview" class="mt-8 p-4 bg-gray-50 rounded-lg w-full">
      <h3 class="text-lg font-semibold mb-2 text-GJDarkGreen">
        Hier eine kleine Vorschau, wie es einmal aussehen kann.
      </h3>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import logo from '../../assets/logo.svg';

const email = 'info@open-dpp.de';

const props = defineProps<{ showPreview?: boolean }>();
</script>

<style scoped>
.logo-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.construction-container {
  min-height: 60vh;
}
</style>
