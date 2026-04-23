<script setup lang="ts">
import { useI18n } from "vue-i18n";

const model = defineModel<boolean>();
defineProps<{
  loading: boolean;
  isLocked: boolean;
  isSaving: boolean;
  translationKey: string;
}>();
const { t } = useI18n();
</script>

<template>
  <Card v-if="!loading">
    <template #content>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="model" :disabled="isLocked || isSaving" />
          <div class="flex flex-col">
            <span class="font-medium">
              {{ t(`organizations.admin.instanceSettings.${translationKey}`) }}
            </span>
            <span class="text-sm text-gray-500">
              {{ t(`organizations.admin.instanceSettings.${translationKey}Description`) }}
            </span>
            <span v-if="isLocked" class="mt-1 flex items-center gap-1 text-sm text-amber-600">
              <LockClosedIcon class="size-4" />
              {{ t("organizations.admin.instanceSettings.lockedByEnv") }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
