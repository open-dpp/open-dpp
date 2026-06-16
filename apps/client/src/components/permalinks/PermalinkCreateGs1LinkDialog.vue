<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto, PermalinkPublicDto } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../../stores/error.handling";
import apiClient from "../../lib/api-client";
import Gs1DataAttributesField from "./Gs1DataAttributesField.vue";

// ---------------------------------------------------------------------------
// Props / emits / model
// ---------------------------------------------------------------------------

const model = defineModel<boolean>("visible");

const props = defineProps<{
  /** UPI UUIDs that already have an existing gs1-link permalink (at most one per UPI). */
  existingGs1LinkUpiIds: string[];
}>();

const emit = defineEmits<{
  created: [permalink: PermalinkPublicDto];
}>();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const upis = ref<UniqueProductIdentifierListItemDto[]>([]);
const loadingUpis = ref(false);

const selectedUpiId = ref<string | undefined>(undefined);
const gs1ResolverBase = ref<string>("");
const gs1DataAttributes = ref<Record<string, string>>({});

const conflictError = ref<string | null>(null);
const busy = ref(false);

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

/**
 * Only GS1 UPIs appear in the select — OPEN_DPP_UUID rows are system-only
 * and cannot be used as a gs1-link target.
 */
const gs1Upis = computed(() =>
  upis.value.filter((u) => u.type === "GS1"),
);

/** True when the selected UPI already has a gs1-link permalink. */
const selectedUpiAlreadyLinked = computed(() => {
  if (!selectedUpiId.value) return false;
  return props.existingGs1LinkUpiIds.includes(selectedUpiId.value);
});

const canSubmit = computed(
  () =>
    !!selectedUpiId.value &&
    !selectedUpiAlreadyLinked.value &&
    !busy.value,
);

// ---------------------------------------------------------------------------
// UPI label helper
// ---------------------------------------------------------------------------

function upiLabel(upi: UniqueProductIdentifierListItemDto): string {
  const parts: string[] = [];
  if (upi.gtin) parts.push(upi.gtin);
  if (upi.batch) parts.push(upi.batch);
  if (upi.serial) parts.push(upi.serial);
  return parts.length > 0 ? parts.join(" / ") : upi.uuid;
}

// ---------------------------------------------------------------------------
// Load UPIs on mount
// ---------------------------------------------------------------------------

async function loadUpis() {
  loadingUpis.value = true;
  try {
    // The list endpoint returns the cursor envelope ({ paging_metadata, result });
    // this picker only needs the first page of rows (server caps the page size).
    const response = await apiClient.dpp.uniqueProductIdentifiers.list();
    upis.value = (response.data?.result ?? []) as UniqueProductIdentifierListItemDto[];
  } finally {
    loadingUpis.value = false;
  }
}

onMounted(async () => {
  await loadUpis();
});

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

async function submit() {
  if (!canSubmit.value || !selectedUpiId.value) return;
  conflictError.value = null;
  busy.value = true;
  try {
    const body = {
      kind: "gs1-link" as const,
      uniqueProductIdentifierId: selectedUpiId.value,
      presentationConfigurationId: null,
      gs1ResolverBase: gs1ResolverBase.value.trim() || null,
      gs1DataAttributes:
        Object.keys(gs1DataAttributes.value).length > 0 ? gs1DataAttributes.value : null,
    };

    const response = await apiClient.dpp.permalinks.create(body);
    emit("created", response.data as PermalinkPublicDto);
    model.value = false;
    resetForm();
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (status === 409) {
      conflictError.value = t("permalink.createGs1Link.conflict");
    } else {
      errorHandlingStore.logErrorWithNotification(
        t("permalink.createGs1Link.conflict"),
        e,
      );
    }
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  selectedUpiId.value = undefined;
  gs1ResolverBase.value = "";
  gs1DataAttributes.value = {};
  conflictError.value = null;
}

function cancel() {
  model.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('permalink.createGs1Link.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <!-- UPI Select -->
      <div class="flex flex-col gap-2">
        <label for="gs1-link-upi" class="text-sm font-medium leading-6 text-gray-900">
          {{ t("permalink.createGs1Link.selectUpi") }}
        </label>
        <Select
          id="gs1-link-upi"
          v-model="selectedUpiId"
          data-testid="gs1-link-upi-select"
          :options="gs1Upis"
          option-value="uuid"
          :option-label="upiLabel"
          :placeholder="t('permalink.createGs1Link.selectUpi')"
          :loading="loadingUpis"
          :disabled="busy || loadingUpis"
          filter
        />
      </div>

      <!-- At-most-one-per-UPI warning -->
      <Message
        v-if="selectedUpiAlreadyLinked"
        severity="warn"
        :closable="false"
        data-testid="gs1-link-already-linked-msg"
      >
        {{ t("permalink.createGs1Link.upiAlreadyLinked") }}
      </Message>

      <!-- Conflict error (409) -->
      <Message
        v-if="conflictError"
        severity="error"
        :closable="false"
        data-testid="gs1-link-conflict-error"
      >
        {{ conflictError }}
      </Message>

      <!-- GS1 Resolver Base URL (optional) -->
      <div class="flex flex-col gap-2">
        <label for="gs1-link-resolver-base" class="text-sm font-medium leading-6 text-gray-900">
          {{ t("permalink.createGs1Link.gs1ResolverBase.label") }}
        </label>
        <InputText
          id="gs1-link-resolver-base"
          v-model="gs1ResolverBase"
          data-testid="gs1-link-resolver-base"
          :placeholder="t('permalink.createGs1Link.gs1ResolverBase.placeholder')"
          :disabled="busy"
          autocomplete="off"
        />
      </div>

      <!-- GS1 Data Attributes (optional) -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium leading-6 text-gray-900">
          {{ t("permalink.createGs1Link.gs1DataAttributes") }}
        </label>
        <Gs1DataAttributesField
          v-model="gs1DataAttributes"
          data-testid="gs1-data-attributes-field"
        />
      </div>
    </div>

    <template #footer>
      <Button
        :label="t('common.cancel')"
        severity="secondary"
        variant="text"
        :disabled="busy"
        @click="cancel"
      />
      <Button
        :label="t('permalink.createGs1Link.submit')"
        data-testid="gs1-link-create-submit"
        :disabled="!canSubmit"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
