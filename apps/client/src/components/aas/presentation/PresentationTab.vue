<script lang="ts" setup>
import type { AasNamespace, PresentationConfigurationNamespace } from "@open-dpp/api-client";
import type {
  SubmodelElementResponseDto,
  SubmodelElementSharedResponseDto,
} from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Column from "primevue/column";
import Select from "primevue/select";
import TreeTable from "primevue/treetable";
import { DataTypeDef, KeyTypes, PresentationComponentName } from "@open-dpp/dto";
import { usePresentationConfig } from "../../../composables/presentation-config.ts";
import BigNumberValue from "../../presentation/components/BigNumberValue.vue";
import { useErrorHandlingStore } from "../../../stores/error.handling.ts";

const { id, submodels, presentationConfigurationNamespace } = defineProps<{
  id: string;
  aasNamespace: AasNamespace;
  presentationConfigurationNamespace: PresentationConfigurationNamespace;
  submodels: TreeNode[];
}>();

const errorHandlingStore = useErrorHandlingStore();
const { t } = useI18n();

// AAS numeric value types — only these Properties accept BigNumber today.
const NUMERIC_VALUE_TYPES = new Set<string>([
  DataTypeDef.Decimal,
  DataTypeDef.Integer,
  DataTypeDef.Double,
  DataTypeDef.Float,
  DataTypeDef.Long,
  DataTypeDef.Int,
  DataTypeDef.Short,
  DataTypeDef.Byte,
  DataTypeDef.NegativeInteger,
  DataTypeDef.NonNegativeInteger,
  DataTypeDef.NonPositiveInteger,
  DataTypeDef.PositiveInteger,
  DataTypeDef.UnsignedByte,
  DataTypeDef.UnsignedInt,
  DataTypeDef.UnsignedLong,
  DataTypeDef.UnsignedShort,
]);

// Container element types occupy a row in the tree but never carry a
// presentation component themselves — only their leaf descendants do.
const CONTAINER_MODEL_TYPES = new Set<string>([
  KeyTypes.Submodel,
  KeyTypes.SubmodelElementCollection,
  KeyTypes.SubmodelElementList,
]);

const DEFAULT_VALUE = "default";

// Placeholder used only when previewing a component on an element that doesn't
// have a value yet (typical during template authoring). The actual viewer
// always renders the element's real value — this just gives the preview
// something meaningful to draw.
const PREVIEW_PLACEHOLDER_VALUE = "42";

interface SelectOption {
  label: string;
  value: string;
}

const config = usePresentationConfig({
  id,
  namespace: presentationConfigurationNamespace,
  errorHandlingStore,
  translate: t,
});

onMounted(async () => {
  await config.fetch();
});

const defaultOption = computed<SelectOption>(() => ({
  label: t("aasEditor.presentationTab.default"),
  value: DEFAULT_VALUE,
}));

const bigNumberOption = computed<SelectOption>(() => ({
  label: t("aasEditor.presentationTab.bigNumber"),
  value: PresentationComponentName.BigNumber,
}));

function isContainer(node: TreeNode): boolean {
  const modelType = node.data?.modelType;
  return typeof modelType === "string" && CONTAINER_MODEL_TYPES.has(modelType);
}

function optionsFor(node: TreeNode): SelectOption[] {
  const plain = node.data?.plain as
    | (SubmodelElementSharedResponseDto & { valueType?: string })
    | undefined;
  const base: SelectOption[] = [defaultOption.value];
  if (
    plain?.modelType === KeyTypes.Property &&
    NUMERIC_VALUE_TYPES.has(plain.valueType ?? "")
  ) {
    base.push(bigNumberOption.value);
  }
  return base;
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
  if (next === PresentationComponentName.BigNumber) {
    await config.setElementDesign(path, PresentationComponentName.BigNumber);
  }
}

function previewElementFor(node: TreeNode): SubmodelElementResponseDto {
  const plain = node.data?.plain as SubmodelElementResponseDto;
  if (plain.value !== null && plain.value !== undefined && plain.value !== "") return plain;
  return { ...plain, value: PREVIEW_PLACEHOLDER_VALUE } as SubmodelElementResponseDto;
}

const hasSubmodels = computed(() => submodels.length > 0);
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <header class="flex max-w-[65ch] flex-col gap-1">
      <h2 class="text-xl font-semibold text-surface-900">
        {{ t("aasEditor.presentationTab.title") }}
      </h2>
      <p class="text-sm text-gray-600">
        {{ t("aasEditor.presentationTab.description") }}
      </p>
    </header>

    <p v-if="config.loading.value" class="text-sm text-gray-500">
      {{ t("common.loading") }}
    </p>

    <p
      v-else-if="!hasSubmodels"
      data-cy="presentation-tab-empty"
      class="text-sm text-gray-600"
    >
      {{ t("aasEditor.presentationTab.emptyState") }}
    </p>

    <TreeTable
      v-else
      :value="submodels"
      table-style="min-width: 50rem"
      :meta-key-selection="false"
    >
      <Column field="label" :header="t('aasEditor.presentationTab.property')" expander style="width: 40%" />
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
          <div
            v-if="!isContainer(node) && selectedFor(node) === PresentationComponentName.BigNumber"
            :data-cy="`presentation-preview-${pathFor(node)}`"
          >
            <BigNumberValue :element="previewElementFor(node)" />
          </div>
        </template>
      </Column>
    </TreeTable>
  </div>
</template>
