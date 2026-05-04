<script lang="ts" setup>
import type { AasNamespace, PresentationConfigurationNamespace } from "@open-dpp/api-client";
import type {
  PresentationComponentNameType,
  SubmodelElementResponseDto,
  SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed, onMounted, provide } from "vue";
import { useI18n } from "vue-i18n";
import Column from "primevue/column";
import Select from "primevue/select";
import TreeTable from "primevue/treetable";
import { DataTypeDef, isNumericDataType, KeyTypes } from "@open-dpp/dto";
import { usePresentationConfig } from "../../../composables/presentation-config.ts";
import { presentationConfigKey } from "../../presentation/presentation-config.ts";
import { PRESENTATION_COMPONENTS } from "../../presentation/components/presentation-components.ts";
import SubmodelElementValue from "../../presentation/SubmodelElementValue.vue";
import { useErrorHandlingStore } from "../../../stores/error.handling.ts";

const { id, submodels, presentationConfigurationNamespace } = defineProps<{
  id: string;
  aasNamespace: AasNamespace;
  presentationConfigurationNamespace: PresentationConfigurationNamespace;
  submodels: TreeNode[];
}>();

const errorHandlingStore = useErrorHandlingStore();
const { t } = useI18n();

const DEFAULT_VALUE = "default";

interface SelectOption {
  label: string;
  value: string;
}

type LeafElement = SubmodelElementSharedResponseDto & { valueType?: string };

const config = usePresentationConfig({
  id,
  namespace: presentationConfigurationNamespace,
  errorHandlingStore,
  translate: t,
});

provide(presentationConfigKey, config.config);

onMounted(async () => {
  await config.fetch();
});

const defaultOption = computed<SelectOption>(() => ({
  label: t("aasEditor.presentationTab.default"),
  value: DEFAULT_VALUE,
}));

// Container element types occupy a row in the tree but never carry a
// presentation component themselves — only their leaf descendants do.
function isContainer(node: TreeNode): boolean {
  const modelType = node.data?.modelType;
  return (
    modelType === KeyTypes.Submodel ||
    modelType === KeyTypes.SubmodelElementCollection ||
    modelType === KeyTypes.SubmodelElementList
  );
}

function leafFor(node: TreeNode): LeafElement | undefined {
  const plain = node.data?.plain as LeafElement | undefined;
  if (!plain || !plain.modelType) return undefined;
  return plain;
}

function optionsFor(node: TreeNode): SelectOption[] {
  const plain = leafFor(node);
  const options: SelectOption[] = [defaultOption.value];
  if (!plain) return options;
  for (const [name, entry] of Object.entries(PRESENTATION_COMPONENTS) as [
    PresentationComponentNameType,
    (typeof PRESENTATION_COMPONENTS)[PresentationComponentNameType],
  ][]) {
    if (entry.appliesTo(plain as LeafElement & { modelType: typeof KeyTypes.Property })) {
      options.push({ label: t(entry.i18nKey), value: name });
    }
  }
  return options;
}

function pathFor(node: TreeNode): string | undefined {
  const raw = node.data?.path?.idShortPathIncludingSubmodel;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function selectedFor(node: TreeNode): string {
  const path = pathFor(node);
  if (!path) return DEFAULT_VALUE;
  return config.config.value?.elementDesign?.[path] ?? DEFAULT_VALUE;
}

async function onChange(node: TreeNode, next: string) {
  const path = pathFor(node);
  if (!path) return;
  if (next === DEFAULT_VALUE) {
    await config.removeElementDesign(path);
    return;
  }
  await config.setElementDesign(path, next as PresentationComponentNameType);
}

function previewValueFor(valueType: string | undefined | null): string {
  if (isNumericDataType(valueType ?? undefined)) return "42";
  if (valueType === DataTypeDef.Boolean) return "true";
  if (valueType === DataTypeDef.Date) return "2024-01-15";
  if (valueType === DataTypeDef.DateTime) return "2024-01-15T12:00:00Z";
  return "Example";
}

function previewElementFor(node: TreeNode): SubmodelElementResponseDto {
  const plain = node.data?.plain as SubmodelElementResponseDto & { valueType?: string };
  if (plain.value !== null && plain.value !== undefined && plain.value !== "") return plain;
  return { ...plain, value: previewValueFor(plain.valueType) } as SubmodelElementResponseDto;
}

// Only leaf elements whose viewer rendering is self-contained (no async media
// fetch, no navigation link) produce a meaningful preview today. For v1 that
// means Property elements — MultiLanguageProperty, File, and Reference previews
// depend on real data/media and are left blank intentionally.
function isPreviewable(node: TreeNode): boolean {
  if (isContainer(node)) return false;
  const plain = leafFor(node);
  return plain?.modelType === KeyTypes.Property;
}

const hasSubmodels = computed(() => submodels.length > 0);
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex max-w-[65ch] flex-col gap-1">
      <h2 class="text-surface-900 text-xl font-semibold">
        {{ t("aasEditor.presentationTab.title") }}
      </h2>
      <p class="text-sm text-gray-600">
        {{ t("aasEditor.presentationTab.description") }}
      </p>
    </header>

    <p v-if="config.loading.value" class="text-sm text-gray-500">
      {{ t("common.loading") }}
    </p>

    <p v-else-if="!hasSubmodels" data-cy="presentation-tab-empty" class="text-sm text-gray-600">
      {{ t("aasEditor.presentationTab.emptyState") }}
    </p>

    <TreeTable v-else :value="submodels" table-style="min-width: 50rem" :meta-key-selection="false">
      <Column
        field="label"
        :header="t('aasEditor.presentationTab.property')"
        expander
        style="width: 40%"
      />
      <Column field="type" :header="t('aasEditor.type')" style="width: 20%" />
      <Column :header="t('aasEditor.presentationTab.component')" style="width: 22%">
        <template #body="{ node }">
          <Select
            v-if="!isContainer(node)"
            :data-cy="`presentation-select-${pathFor(node)}`"
            :model-value="selectedFor(node)"
            :options="optionsFor(node)"
            option-label="label"
            option-value="value"
            class="w-full max-w-[16rem]"
            @update:model-value="(value: string) => onChange(node, value)"
          />
          <span v-else aria-hidden="true" class="text-gray-400">—</span>
        </template>
      </Column>
      <Column :header="t('aasEditor.presentationTab.preview')" style="width: 18%">
        <template #body="{ node }">
          <dl
            v-if="isPreviewable(node)"
            :data-cy="`presentation-preview-${pathFor(node)}`"
            class="m-0"
          >
            <SubmodelElementValue :element="previewElementFor(node)" :path="pathFor(node)" />
          </dl>
        </template>
      </Column>
    </TreeTable>
  </div>
</template>
