<script lang="ts" setup>
import { CubeIcon, UsersIcon } from "@heroicons/vue/24/outline";
import { computed } from "vue";

const props = defineProps<{
  organizationId: string;
}>();

const actions = computed(() => [
  {
    title: "Mitglieder hinzufügen",
    description:
      "Mitglieder der Organisation ansehen, um dort ein neues Mitglieder hinzuzufügen.",
    to: `/organizations/${props.organizationId}/members`,
    icon: UsersIcon,
    iconForeground: "text-sky-700",
    iconBackground: "bg-sky-50",
  },
  {
    title: "Modell hinzufügen",
    description:
      "Modelle der Organisation ansehen, um dort ein neues Modell hinzuzufügen.",
    to: `/organizations/${props.organizationId}/models`,
    icon: CubeIcon,
    iconForeground: "text-yellow-700",
    iconBackground: "bg-yellow-50",
  },
]);
</script>

<template>
  <div
    class="divide-y divide-gray-200 overflow-hidden rounded-lg bg-gray-200 shadow-sm sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0"
  >
    <div
      v-for="(action, actionIdx) in actions"
      :key="action.title"
      class="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500" :class="[
        actionIdx === 0 ? 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none' : '',
        actionIdx === 1 ? 'sm:rounded-tr-lg' : '',
        actionIdx === actions.length - 2 ? 'sm:rounded-bl-lg' : '',
        actionIdx === actions.length - 1
          ? 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none'
          : '',
      ]"
    >
      <div>
        <span
          class="inline-flex rounded-lg p-3 ring-4 ring-white" :class="[
            action.iconBackground,
            action.iconForeground,
          ]"
        >
          <component :is="action.icon" aria-hidden="true" class="h-6 w-6" />
        </span>
      </div>
      <div class="mt-8">
        <h3 class="text-base font-semibold leading-6 text-gray-900">
          <router-link :to="action.to" class="focus:outline-hidden">
            <!-- Extend touch target to entire panel -->
            <span aria-hidden="true" class="absolute inset-0" />
            {{ action.title }}
          </router-link>
        </h3>
        <p class="mt-2 text-sm text-gray-500">
          {{ action.description }}
        </p>
      </div>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-6 top-6 text-gray-300 group-hover:text-gray-400"
      >
        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z"
          />
        </svg>
      </span>
    </div>
  </div>
</template>
