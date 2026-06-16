<script lang="ts" setup>
import {
  isValidCset82Component,
  type UniqueProductIdentifierListItemDto,
  type PassportDto,
} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { isAxiosError } from "axios";
import { useErrorHandlingStore } from "../../stores/error.handling";

const model = defineModel<boolean>("visible");

const props = defineProps<{
  draftPassports: PassportDto[];
  createGs1Upi: (data: {
    referenceId: string;
    gtin: string;
    batch?: string;
    serial?: string;
  }) => Promise<UniqueProductIdentifierListItemDto>;
}>();

const emit = defineEmits<{
  created: [upi: UniqueProductIdentifierListItemDto];
}>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const selectedPassportId = ref<string | undefined>(undefined);
const gtin = ref<string>("");
const batch = ref<string>("");
const serial = ref<string>("");
const gtinError = ref<string | null>(null);
const busy = ref<boolean>(false);

const hasDraftPassports = computed(() => props.draftPassports.length > 0);

/**
 * Live client-side validation for an optional batch / serial:
 * an empty value is valid (it clears the component);
 * a non-empty value must satisfy GS1 CSET-82 and the 20-character cap.
 * Returns a localized error message or null.
 */
function validateComponent(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidCset82Component(trimmed)
    ? null
    : t("uniqueProductIdentifiers.create.componentInvalid");
}

const batchError = computed(() => validateComponent(batch.value));
const serialError = computed(() => validateComponent(serial.value));
const hasComponentError = computed(
  () => batchError.value !== null || serialError.value !== null,
);

const canSubmit = computed(
  () =>
    hasDraftPassports.value &&
    !!selectedPassportId.value &&
    gtin.value.trim().length > 0 &&
    !hasComponentError.value &&
    !busy.value,
);

async function submit() {
  if (!canSubmit.value || !selectedPassportId.value) return;
  gtinError.value = null;
  busy.value = true;
  try {
    const batchTrimmed = batch.value.trim() || undefined;
    const serialTrimmed = serial.value.trim() || undefined;

    const upi = await props.createGs1Upi({
      referenceId: selectedPassportId.value,
      gtin: gtin.value.trim(),
      ...(batchTrimmed !== undefined && { batch: batchTrimmed }),
      ...(serialTrimmed !== undefined && { serial: serialTrimmed }),
    });

    emit("created", upi);
    model.value = false;
    resetForm();
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (status === 400) {
      gtinError.value = t("uniqueProductIdentifiers.create.gtinInvalid");
    } else if (status === 409) {
      gtinError.value = t("uniqueProductIdentifiers.create.duplicate");
    } else {
      errorHandlingStore.logErrorWithNotification(
        t("uniqueProductIdentifiers.create.gtinInvalid"),
        e,
      );
    }
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  selectedPassportId.value = undefined;
  gtin.value = "";
  batch.value = "";
  serial.value = "";
  gtinError.value = null;
}

function cancel() {
  model.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('uniqueProductIdentifiers.create.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <Message
        v-if="!hasDraftPassports"
        severity="warn"
        :closable="false"
        data-testid="upi-no-draft-passports"
      >
        {{ t("uniqueProductIdentifiers.create.noDraftPassports") }}
      </Message>

      <div class="flex flex-col gap-2">
        <label for="upi-passport" class="text-sm font-medium leading-6 text-gray-900">
          {{ t("uniqueProductIdentifiers.create.selectDraftPassport") }}
        </label>
        <Select
          id="upi-passport"
          v-model="selectedPassportId"
          data-testid="upi-create-passport"
          :options="draftPassports"
          option-value="id"
          option-label="id"
          :placeholder="t('uniqueProductIdentifiers.create.selectDraftPassport')"
          :disabled="!hasDraftPassports || busy"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="upi-gtin" class="text-sm font-medium leading-6 text-gray-900">
          {{ t("uniqueProductIdentifiers.create.gtin") }}
        </label>
        <InputText
          id="upi-gtin"
          v-model="gtin"
          data-testid="upi-create-gtin"
          :invalid="!!gtinError"
          :disabled="busy"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
        />
        <small v-if="gtinError" class="text-red-500" data-testid="upi-create-gtin-error">
          {{ gtinError }}
        </small>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <div class="flex flex-1 flex-col gap-2">
          <label for="upi-batch" class="text-sm font-medium leading-6 text-gray-900">
            {{ t("uniqueProductIdentifiers.create.batch") }}
          </label>
          <InputText
            id="upi-batch"
            v-model="batch"
            data-testid="upi-create-batch"
            :invalid="!!batchError"
            :disabled="busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="20"
          />
          <small v-if="batchError" class="text-red-500" data-testid="upi-create-batch-error">
            {{ batchError }}
          </small>
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <label for="upi-serial" class="text-sm font-medium leading-6 text-gray-900">
            {{ t("uniqueProductIdentifiers.create.serial") }}
          </label>
          <InputText
            id="upi-serial"
            v-model="serial"
            data-testid="upi-create-serial"
            :invalid="!!serialError"
            :disabled="busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="20"
          />
          <small v-if="serialError" class="text-red-500" data-testid="upi-create-serial-error">
            {{ serialError }}
          </small>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        :label="t('common.cancel')"
        severity="secondary"
        variant="text"
        @click="cancel"
        :disabled="busy"
      />
      <Button
        :label="t('uniqueProductIdentifiers.create.submit')"
        data-testid="upi-create-submit"
        @click="submit"
        :disabled="!canSubmit"
      />
    </template>
  </Dialog>
</template>
