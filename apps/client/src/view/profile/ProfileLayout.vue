<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const tabs = computed(() => [
  { route: "/profile", label: t("user.tabs.profile"), testId: "profile-tab-general" },
  {
    route: "/profile/invitations",
    label: t("user.tabs.invitations"),
    testId: "profile-tab-invitations",
  },
  { route: "/profile/api-keys", label: t("user.tabs.apiKeys"), testId: "profile-tab-api-keys" },
]);

const activeTab = computed(() => route.path);

function onTabChange(value: string | number) {
  router.push(String(value));
}
</script>

<template>
  <section class="p-3">
    <Tabs :value="activeTab" @update:value="onTabChange">
      <TabList>
        <Tab v-for="tab in tabs" :key="tab.route" :value="tab.route" :data-testid="tab.testId">
          {{ tab.label }}
        </Tab>
      </TabList>
    </Tabs>
    <div class="pt-3">
      <router-view />
    </div>
  </section>
</template>
