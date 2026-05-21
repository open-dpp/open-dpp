<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <Tabs value="0">
    <TabList>
      <Tab value="0">{{ t("aasEditor.data") }}</Tab>
      <Tab value="1">{{ t("activityHistory.label") }}</Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="0">
        <slot name="data" />
      </TabPanel>
      <TabPanel value="1">
        <slot name="activityHistory" />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
