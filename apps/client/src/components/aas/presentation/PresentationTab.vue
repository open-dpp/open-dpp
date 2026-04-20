<script lang="ts" setup>
import type { AasNamespace, PresentationConfigurationNamespace } from "@open-dpp/api-client";
import type { SubmodelElementSharedResponseDto } from "@open-dpp/dto";
import type { TreeNode } from "primevue/treenode";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { DataTypeDef, KeyTypes, PresentationComponentName } from "@open-dpp/dto";
import { usePresentationConfig } from "../../../composables/presentation-config.ts";
import { useErrorHandlingStore } from "../../../stores/error.handling.ts";

const { id, submodels, presentationConfigurationNamespace } = defineProps<{
  id: string;
  aasNamespace: AasNamespace;
  presentationConfigurationNamespace: PresentationConfigurationNamespace;
  submodels: TreeNode[];
}>();

const errorHandlingStore = useErrorHandlingStore();
const { t } = useI18n();

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

interface NumericPropertyRow {
  path: string;
  label: string;
  submodelLabel: string;
  valueType: string;
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

// Only direct children of a Submodel are listed. Nested Properties inside
// SubmodelElementCollections are intentionally excluded: this tab stores paths
// as `idShortPathIncludingSubmodel`, but the public viewer's path threading
// resets at the submodel context when drilling into a SEC, so a BigNumber
// assignment on a nested path wouldn't match at render time. Remove this
// restriction once the viewer threads the full submodel-qualified path into
// SubmodelElementCollection descendants — see follow-up linked in PR #520.
const rows = computed<NumericPropertyRow[]>(() => {
  const out: NumericPropertyRow[] = [];

  for (const submodelNode of submodels) {
    const submodelLabel = submodelNode.data?.label ?? "";
    for (const child of submodelNode.children ?? []) {
      const plain = child.data?.plain as
        | (SubmodelElementSharedResponseDto & { valueType?: string })
        | undefined;
      if (
        plain &&
        plain.modelType === KeyTypes.Property &&
        NUMERIC_VALUE_TYPES.has(plain.valueType ?? "")
      ) {
        out.push({
          path: child.data.path.idShortPathIncludingSubmodel,
          label: child.data.label ?? plain.idShort,
          submodelLabel,
          valueType: plain.valueType ?? "",
        });
      }
    }
  }

  return out;
});

function currentComponent(path: string): string {
  return config.config.value?.elementDesign?.[path] ?? "";
}

async function onChange(path: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === "" || value === "default") {
    await config.removeElementDesign(path);
  } else {
    await config.setElementDesign(path, PresentationComponentName.BigNumber);
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-bold">{{ t("aasEditor.presentationTab.title") }}</h2>
      <p class="text-sm text-gray-600">
        {{ t("aasEditor.presentationTab.description") }}
      </p>
    </div>

    <div v-if="config.loading.value" class="text-sm text-gray-500">
      {{ t("common.loading") }}
    </div>

    <div
      v-else-if="rows.length === 0"
      data-cy="presentation-tab-empty"
      class="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500"
    >
      {{ t("aasEditor.presentationTab.emptyState") }}
    </div>

    <div v-else class="border-surface-200 bg-surface-0 overflow-hidden rounded-xl border shadow-sm">
      <table class="w-full divide-y divide-gray-100 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-700">
              {{ t("aasEditor.presentationTab.property") }}
            </th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">
              {{ t("aasEditor.presentationTab.path") }}
            </th>
            <th class="px-4 py-3 text-left font-medium text-gray-700">
              {{ t("aasEditor.presentationTab.component") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr v-for="row in rows" :key="row.path" :data-cy="`presentation-row-${row.path}`">
            <td class="px-4 py-3 text-gray-900">{{ row.label }}</td>
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ row.path }}</td>
            <td class="px-4 py-3">
              <select
                :data-cy="`presentation-select-${row.path}`"
                :value="currentComponent(row.path) || 'default'"
                class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                @change="onChange(row.path, $event)"
              >
                <option value="default">
                  {{ t("aasEditor.presentationTab.default") }}
                </option>
                <option :value="PresentationComponentName.BigNumber">
                  {{ t("aasEditor.presentationTab.bigNumber") }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
