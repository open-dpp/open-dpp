<script lang="ts" setup>
import type { TemplateDto } from "@open-dpp/dto";
import { Button, Dialog, RadioButton, Select } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { usePassports } from "../../composables/passports";
import { useTemplates } from "../../composables/templates";

const route = useRoute();

function changeQueryParams(_: Record<string, string | undefined>) {}

const { templates, loading, init, hasNext, nextPage } = useTemplates({
  changeQueryParams,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
});

const { createPassport } = usePassports({
  changeQueryParams,
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
});

const { t } = useI18n();
const templateList = ref<TemplateDto[]>([]);

const visible = ref(false);
const mode = ref<"blank" | "template">("blank");
const template = ref<string | null>(null);

function open() {
  visible.value = true;
}

async function newPassport() {
  const passportParams = mode.value === "template" && template.value
    ? { templateId: template.value }
    : { displayName: [] };

  const result = await createPassport(passportParams);
  if (result) {
    await close();
  }
}

async function loadMoreTemplates() {
  if (hasNext.value) {
    await nextPage();
    if (templates.value) {
      templateList.value.push(...templates.value.result);
    }
  }
}

async function onTemplateLazyLoad(e: { last: number }) {
  if (e.last >= templateList.value.length - 1) {
    await loadMoreTemplates();
  }
}

async function close() {
  visible.value = false;
}

defineExpose({
  open,
});

onMounted(async () => {
  await init();
  if (templates.value) {
    templateList.value.push(...templates.value.result);
  }
});
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="t('passports.create')"
    @hide="close"
  >
    <div class="flex flex-col flex-wrap gap-4 mb-8">
      <div class="flex items-center gap-2">
        <RadioButton
          v-model="mode"
          input-id="blank"
          name="mode"
          value="blank"
        />
        <label for="blank">{{ t("passports.blank") }}</label>
      </div>
      <div class="flex items-center gap-2">
        <RadioButton
          v-model="mode"
          input-id="template"
          name="mode"
          value="template"
        />
        <label for="template" class="flex flex-col">
          <span>
            {{ t("passports.fromTemplate") }}
          </span>
        </label>
      </div>
      <Select
        v-model="template"
        class="w-96"
        :options="templateList"
        option-value="id"
        option-label="id"
        :virtual-scroller-options="{
          itemSize: 40,
          lazy: true,
          onLazyLoad: onTemplateLazyLoad,
        }"
        :placeholder="t('passports.selectTemplate')"
        :disabled="loading || mode === 'blank'"
      >
        <!-- Render label safely without assuming a specific property -->
        <template #option="{ option }">
          {{ option.name ?? option.title ?? option.id }}
        </template>
      </Select>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="close">
        {{ t("common.cancel") }}
      </Button>
      <Button
        :disabled="loading || (mode === 'template' && template === null)"
        @click="newPassport"
      >
        {{ t("common.create") }}
      </Button>
    </div>
  </Dialog>
</template>
