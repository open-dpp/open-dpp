<script lang="ts" setup>
import type { TemplateDto } from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useAasUtils } from "../../composables/aas-utils.ts";
import { usePassports } from "../../composables/passports";
import { useTemplates } from "../../composables/templates";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import { usePagination } from "../../composables/pagination.ts";

const route = useRoute();

function changeQueryParams(_: Record<string, string | undefined>) {}

const { templates, loading, fetchTemplates } = useTemplates();

const { hasNext, nextPage } = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback: (pagingParams) => fetchTemplates(pagingParams, undefined),
  changeQueryParams,
});

const { createPassport } = usePassports();

const { t, locale } = useI18n();
type TemplateOption = TemplateDto & { label: string };
const templateList = ref<TemplateOption[]>([]);

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

async function loadMoreTemplates() {
  if (hasNext.value) {
    await nextPage();
    if (templates.value) {
      templateList.value.push(
        ...templates.value.result.map((template) => ({
          ...template,
          label: getOptionLabel(template),
        })),
      );
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
  await nextPage();
  if (templates.value) {
    templateList.value.push(
      ...templates.value.result.map((template) => ({
        ...template,
        label: getOptionLabel(template),
      })),
    );
  }
});

const { parseDisplayNameFromEnvironment } = useAasUtils({
  translate: t,
  selectedLanguage: convertLocaleToLanguage(locale.value),
});
function getOptionLabel(option: TemplateDto): string {
  const displayName = parseDisplayNameFromEnvironment(option.environment);
  return displayName !== t("common.untitled") ? displayName : option.id;
}
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
      <Select
        v-model="template"
        class="w-96"
        :options="templateList"
        option-value="id"
        option-label="label"
        :virtual-scroller-options="{
          itemSize: 40,
          lazy: true,
          onLazyLoad: onTemplateLazyLoad,
        }"
        :placeholder="t('passports.selectTemplate')"
        :disabled="loading || mode === 'blank'"
      />
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
