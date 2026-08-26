<script lang="ts" setup>
import { isValidCset82Component, type UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { isAxiosError } from "axios";
import { useErrorHandlingStore } from "../../stores/error.handling";

const model = defineModel<boolean>("visible");

const props = defineProps<{
  passportId: string;
  passportPublished: boolean;
  createGs1Upi: (data: {
    referenceId: string;
    gtin: string;
    batch?: string;
    serial?: string;
  }) => Promise<UniqueProductIdentifierListItemDto>;
  createInternalUpi: (passportId: string) => Promise<UniqueProductIdentifierListItemDto>;
}>();

const emit = defineEmits<{
  created: [upi: UniqueProductIdentifierListItemDto];
}>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const UPI_TYPE_GS1 = "GS1";
const UPI_TYPE_INTERNAL = "OPEN_DPP_UUID";
const upiType = ref<string>(UPI_TYPE_GS1);
const isGs1 = computed(() => upiType.value === UPI_TYPE_GS1);
const typeOptions = computed(() => [
  { label: t("uniqueProductIdentifiers.create.typeGs1"), value: UPI_TYPE_GS1 },
  { label: t("uniqueProductIdentifiers.create.typeInternal"), value: UPI_TYPE_INTERNAL },
]);

const gtin = ref<string>("");
const batch = ref<string>("");
const serial = ref<string>("");
const gtinError = ref<string | null>(null);
const busy = ref<boolean>(false);

function validateComponent(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidCset82Component(trimmed)
    ? null
    : t("uniqueProductIdentifiers.create.componentInvalid");
}

const batchError = computed(() => validateComponent(batch.value));
const serialError = computed(() => validateComponent(serial.value));
const hasComponentError = computed(() => batchError.value !== null || serialError.value !== null);

const canSubmit = computed(() => {
  if (busy.value) return false;
  if (!isGs1.value) return true;
  return gtin.value.trim().length > 0 && !hasComponentError.value;
});

async function submit() {
  if (!canSubmit.value) return;
  gtinError.value = null;
  busy.value = true;
  try {
    const upi = isGs1.value
      ? await props.createGs1Upi({
          referenceId: props.passportId,
          gtin: gtin.value.trim(),
          ...(batch.value.trim() ? { batch: batch.value.trim() } : {}),
          ...(serial.value.trim() ? { serial: serial.value.trim() } : {}),
        })
      : await props.createInternalUpi(props.passportId);

    emit("created", upi);
    model.value = false;
    resetForm();
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (isGs1.value && status === 400) {
      gtinError.value = t("uniqueProductIdentifiers.create.gtinInvalid");
    } else if (isGs1.value && status === 409) {
      gtinError.value = t("uniqueProductIdentifiers.create.duplicate");
    } else {
      errorHandlingStore.logErrorWithNotification(
        t("uniqueProductIdentifiers.create.createFailed"),
        e,
      );
    }
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  upiType.value = UPI_TYPE_GS1;
  gtin.value = "";
  batch.value = "";
  serial.value = "";
  gtinError.value = null;
}

function cancel() {
  resetForm();
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
      <div class="flex flex-col gap-2">
        <label class="text-sm leading-6 font-medium text-gray-900">
          {{ t("uniqueProductIdentifiers.create.type") }}
        </label>
        <SelectButton
          v-model="upiType"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :disabled="busy"
          data-testid="upi-create-type"
        />
      </div>

      <p class="text-sm text-gray-600" data-testid="upi-create-description">
        {{
          isGs1
            ? t("uniqueProductIdentifiers.create.description")
            : t("uniqueProductIdentifiers.create.internalDescription")
        }}
      </p>

      <Message
        v-if="passportPublished"
        severity="info"
        :closable="false"
        data-testid="upi-passport-published-note"
      >
        {{ t("uniqueProductIdentifiers.create.passportPublishedNote") }}
      </Message>

      <template v-if="isGs1">
        <div class="flex flex-col gap-2">
          <label for="upi-gtin" class="text-sm leading-6 font-medium text-gray-900">
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
            <label for="upi-batch" class="text-sm leading-6 font-medium text-gray-900">
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
            <label for="upi-serial" class="text-sm leading-6 font-medium text-gray-900">
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
      </template>
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
