<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePassports } from "../../composables/passports";
import TemplateSelect from "../template/TemplateSelect.vue";

const { createPassport } = usePassports();

const { t } = useI18n();

const visible = ref(false);
const mode = ref<"blank" | "template">("blank");
const template = ref<string | null>(null);

function open() {
  visible.value = true;
}

async function newPassport() {
  const passportParams =
    mode.value === "template" && template.value
      ? { templateId: template.value }
      : { displayName: [] };

  const result = await createPassport(passportParams);
  if (result) {
    await close();
  }
}

async function close() {
  visible.value = false;
}

defineExpose({
  open,
});
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="t('passports.create')" @hide="close">
    <div class="mb-8 flex flex-col flex-wrap gap-4">
      <div class="flex items-center gap-2">
        <RadioButton v-model="mode" input-id="blank" name="mode" value="blank" />
        <label for="blank">{{ t("passports.blank") }}</label>
      </div>
      <div class="flex items-center gap-2">
        <RadioButton v-model="mode" input-id="template" name="mode" value="template" />
        <label for="template" class="flex flex-col">
          <span>
            {{ t("passports.fromTemplate") }}
          </span>
        </label>
      </div>
      <TemplateSelect v-model="template" class="w-96" :disabled="mode === 'blank'" />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="close">
        {{ t("common.cancel") }}
      </Button>
      <Button
        :disabled="mode === 'template' && template === null"
        @click="newPassport"
      >
        {{ t("common.create") }}
      </Button>
    </div>
  </Dialog>
</template>
