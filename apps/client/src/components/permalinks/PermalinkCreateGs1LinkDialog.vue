<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto, PermalinkPublicDto } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../../stores/error.handling";
import apiClient from "../../lib/api-client";
import Gs1DataAttributesField from "./Gs1DataAttributesField.vue";

// ---------------------------------------------------------------------------
// Props / emits / model
// ---------------------------------------------------------------------------

const model = defineModel<boolean>("visible");

const props = defineProps<{
  /** The passport whose UPIs are offered in the picker. */
  passportId: string;
  /** Preselect this UPI in the Select (e.g. handed over via ?createForUpi=). */
  preselectedUpiId?: string;
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

const selectedUpiId = ref<string | undefined>(props.preselectedUpiId);
const baseUrl = ref<string>("");
const gs1DataAttributes = ref<Record<string, string>>({});
// Submit is blocked while the attributes field holds an invalid or partial row —
// gs1DataAttributes then still carries the last valid map (audit M5).
const gs1AttributesValid = ref(true);

const conflictError = ref<string | null>(null);
const busy = ref(false);

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

/**
 * Only GS1 UPIs without an existing gs1-link permalink appear in the select —
 * OPEN_DPP_UUID rows are system-only and cannot be used as a gs1-link target,
 * and each UPI carries at most one gs1-link permalink (row's own summary).
 */
const gs1Upis = computed(() => upis.value.filter((u) => u.type === "GS1" && u.permalink == null));

const canSubmit = computed(() => !!selectedUpiId.value && !busy.value && gs1AttributesValid.value);

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
// Load UPIs whenever the dialog opens
// ---------------------------------------------------------------------------

// ponytail: one big page instead of a cursor loop — server limit is uncapped
// and a passport's UPI count stays far below this in practice.
const UPI_PICKER_LIMIT = 1000;

async function loadUpis() {
  loadingUpis.value = true;
  try {
    const response = await apiClient.dpp.passports.getUniqueProductIdentifiers(props.passportId, {
      limit: UPI_PICKER_LIMIT,
    });
    upis.value = (response.data?.result ?? []) as UniqueProductIdentifierListItemDto[];
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("permalink.createGs1Link.loadFailed"), e);
  } finally {
    loadingUpis.value = false;
  }
}

// Refetch on every open — a UPI linked since the last open must drop out of
// the options (rows carry their own permalink summary).
watch(
  model,
  (visible) => {
    if (visible) void loadUpis();
  },
  { immediate: true },
);

watch(
  () => props.preselectedUpiId,
  (upiId) => {
    if (upiId) selectedUpiId.value = upiId;
  },
);

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
      baseUrl: baseUrl.value.trim() || null,
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
      errorHandlingStore.logErrorWithNotification(t("permalink.createGs1Link.createFailed"), e);
    }
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  selectedUpiId.value = undefined;
  baseUrl.value = "";
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
        <label for="gs1-link-upi" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.createGs1Link.selectUpi") }}
        </label>
        <Message
          v-if="!loadingUpis && gs1Upis.length === 0"
          severity="info"
          :closable="false"
          data-testid="gs1-link-no-upis-msg"
        >
          {{ t("permalink.createGs1Link.noUpisAvailable") }}
        </Message>
        <Select
          v-else
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

      <!-- Conflict error (409) -->
      <Message
        v-if="conflictError"
        severity="error"
        :closable="false"
        data-testid="gs1-link-conflict-error"
      >
        {{ conflictError }}
      </Message>

      <!-- Custom base URL (optional) -->
      <div class="flex flex-col gap-2">
        <label for="gs1-link-base-url" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.createGs1Link.baseUrl.label") }}
        </label>
        <InputText
          id="gs1-link-base-url"
          v-model="baseUrl"
          data-testid="gs1-link-base-url"
          :placeholder="t('permalink.createGs1Link.baseUrl.placeholder')"
          :disabled="busy"
          autocomplete="off"
        />
      </div>

      <!-- GS1 Data Attributes (optional) -->
      <div class="flex flex-col gap-2">
        <label class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.createGs1Link.gs1DataAttributes") }}
        </label>
        <Gs1DataAttributesField
          v-model="gs1DataAttributes"
          data-testid="gs1-data-attributes-field"
          @update:valid="gs1AttributesValid = $event"
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
