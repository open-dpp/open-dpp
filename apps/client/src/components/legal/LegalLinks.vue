<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useInstanceSettingsStore } from "../../stores/instance-settings";

const { t } = useI18n();
const instanceSettingsStore = useInstanceSettingsStore();

const items = computed(() =>
  [
    { key: "privacyPolicy", url: instanceSettingsStore.legalLinks.privacyPolicyUrl },
    { key: "termsOfService", url: instanceSettingsStore.legalLinks.termsOfServiceUrl },
    { key: "imprint", url: instanceSettingsStore.legalLinks.imprintUrl },
  ].filter((item): item is { key: string; url: string } => !!item.url),
);

onMounted(() => instanceSettingsStore.fetchPublicSettings());
</script>

<template>
  <nav
    v-if="items.length > 0"
    :aria-label="t('legal.navigationLabel')"
    class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500"
    data-cy="legal-links"
  >
    <a
      v-for="item in items"
      :key="item.key"
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-gray-900 hover:underline"
    >
      {{ t(`legal.${item.key}`) }}
    </a>
  </nav>
</template>
