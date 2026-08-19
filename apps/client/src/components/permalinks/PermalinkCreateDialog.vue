<script lang="ts" setup>
import type {
  PermalinkPublicDto,
  PresentationConfigurationDto,
  UniqueProductIdentifierListItemDto,
} from "@open-dpp/dto";
import { PermalinkKind, UniqueProductIdentifierType } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../../stores/error.handling";
import apiClient from "../../lib/api-client";
import Gs1DataAttributesField from "./Gs1DataAttributesField.vue";

const model = defineModel<boolean>("visible");

const props = defineProps<{
  passportId: string;
  upis: UniqueProductIdentifierListItemDto[];
  configs: PresentationConfigurationDto[];
  preselectedUpiId?: string;
}>();

const emit = defineEmits<{
  created: [permalink: PermalinkPublicDto];
}>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const selectedUpiId = ref<string | undefined>(props.preselectedUpiId);
const slug = ref<string>("");
const baseUrl = ref<string>("");
const gs1DataAttributes = ref<Record<string, string>>({});
const gs1AttributesValid = ref(true);

const conflictError = ref<string | null>(null);
const busy = ref(false);

const selectedUpi = computed(() => props.upis.find((upi) => upi.uuid === selectedUpiId.value));
const isGs1 = computed(() => selectedUpi.value?.type === UniqueProductIdentifierType.GS1);

const kindLabel = computed(() =>
  isGs1.value ? t("permalink.list.kindGs1Link") : t("permalink.list.kindPresentation"),
);

const canSubmit = computed(() => !busy.value && (!isGs1.value || gs1AttributesValid.value));

function upiLabel(upi: UniqueProductIdentifierListItemDto): string {
  if (upi.type === UniqueProductIdentifierType.GS1) {
    const parts: string[] = [];
    if (upi.gtin) parts.push(upi.gtin);
    if (upi.batch) parts.push(upi.batch);
    if (upi.serial) parts.push(upi.serial);
    return parts.length > 0 ? parts.join(" / ") : upi.uuid;
  }
  return upi.uuid;
}

watch(
  () => props.preselectedUpiId,
  (upiId) => {
    if (upiId) selectedUpiId.value = upiId;
  },
);

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function submit() {
  if (!canSubmit.value) return;
  conflictError.value = null;
  busy.value = true;
  try {
    const body = isGs1.value
      ? {
          kind: PermalinkKind.GS1_LINK,
          passportId: props.passportId,
          uniqueProductIdentifierId: selectedUpiId.value as string,
          presentationConfigurationId: null,
          baseUrl: trimToNull(baseUrl.value),
          gs1DataAttributes:
            Object.keys(gs1DataAttributes.value).length > 0 ? gs1DataAttributes.value : null,
        }
      : {
          kind: PermalinkKind.OPEN_DPP,
          passportId: props.passportId,
          uniqueProductIdentifierId: selectedUpiId.value ?? null,
          // ponytail: config select hidden (#684) — auto-target last created config
          presentationConfigurationId: props.configs.at(-1)?.id ?? null,
          slug: trimToNull(slug.value),
          baseUrl: trimToNull(baseUrl.value),
        };

    const response = await apiClient.dpp.permalinks.create(body);
    emit("created", response.data as PermalinkPublicDto);
    model.value = false;
    resetForm();
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (status === 409) {
      conflictError.value = isGs1.value
        ? t("permalink.create.upiConflict")
        : t("permalink.create.slugConflict");
    } else {
      errorHandlingStore.logErrorWithNotification(t("permalink.create.createFailed"), e);
    }
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  selectedUpiId.value = undefined;
  slug.value = "";
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
    :header="t('permalink.create.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="permalink-create-upi" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.create.selectUpi") }}
        </label>
        <Select
          id="permalink-create-upi"
          v-model="selectedUpiId"
          data-testid="permalink-create-upi-select"
          :options="props.upis"
          option-value="uuid"
          :option-label="upiLabel"
          :placeholder="t('permalink.create.selectUpiPlaceholder')"
          :disabled="busy"
          show-clear
          filter
        />
        <small class="text-gray-500" data-testid="permalink-create-kind-hint">
          {{ t("permalink.create.kindHint", { kind: kindLabel }) }}
        </small>
      </div>

      <Message
        v-if="conflictError"
        severity="error"
        :closable="false"
        data-testid="permalink-create-conflict-error"
      >
        {{ conflictError }}
      </Message>

      <template v-if="!isGs1">
        <div class="flex flex-col gap-2">
          <label for="permalink-create-slug" class="text-sm leading-6 font-medium text-gray-900">
            {{ t("permalink.create.slug.label") }}
          </label>
          <InputText
            id="permalink-create-slug"
            v-model="slug"
            data-testid="permalink-create-slug"
            :placeholder="t('permalink.create.slug.placeholder')"
            :disabled="busy"
            autocomplete="off"
          />
        </div>
      </template>

      <div class="flex flex-col gap-2">
        <label for="permalink-create-base-url" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.create.baseUrl.label") }}
        </label>
        <InputText
          id="permalink-create-base-url"
          v-model="baseUrl"
          data-testid="permalink-create-base-url"
          :placeholder="t('permalink.create.baseUrl.placeholder')"
          :disabled="busy"
          autocomplete="off"
        />
      </div>

      <div v-if="isGs1" class="flex flex-col gap-2">
        <label class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.create.gs1DataAttributes") }}
        </label>
        <Gs1DataAttributesField
          v-model="gs1DataAttributes"
          data-testid="permalink-create-gs1-data-attributes"
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
        :label="t('permalink.create.submit')"
        data-testid="permalink-create-submit"
        :disabled="!canSubmit"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
