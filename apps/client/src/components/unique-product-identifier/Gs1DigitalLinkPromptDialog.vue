<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";

const model = defineModel<boolean>("visible");

const props = defineProps<{
  upi: UniqueProductIdentifierListItemDto;
}>();

const emit = defineEmits<{
  addLink: [upi: UniqueProductIdentifierListItemDto];
  skip: [];
}>();

const { t } = useI18n();

function onAddLink() {
  emit("addLink", props.upi);
}

function onSkip() {
  emit("skip");
  model.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('uniqueProductIdentifiers.gs1LinkPrompt.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <p>{{ t("uniqueProductIdentifiers.gs1LinkPrompt.question") }}</p>

    <template #footer>
      <Button
        :label="t('uniqueProductIdentifiers.gs1LinkPrompt.skip')"
        severity="secondary"
        variant="text"
        data-testid="gs1-link-prompt-skip"
        @click="onSkip"
      />
      <Button
        :label="t('uniqueProductIdentifiers.gs1LinkPrompt.addLink')"
        data-testid="gs1-link-prompt-add"
        @click="onAddLink"
      />
    </template>
  </Dialog>
</template>
