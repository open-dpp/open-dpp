<script lang="ts" setup>
import type { Gs1IdentityResponse } from "@open-dpp/api-client";
import {
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
  isValidCset82Component,
} from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { isAxiosError } from "axios";
import { useWindowSize } from "@vueuse/core";
import apiClient from "../../lib/api-client";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const model = defineModel<boolean>("visible");
const props = defineProps<{
  passportId: string | undefined;
  status?: DigitalProductDocumentStatusDtoType;
}>();
const emit = defineEmits<{ updated: [identity: Gs1IdentityResponse]; removed: [] }>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();
const { width: windowWidth, height: windowHeight } = useWindowSize();

const identity = ref<Gs1IdentityResponse | undefined>(undefined);
const gtin = ref<string>("");
const batch = ref<string>("");
const serial = ref<string>("");
const gtinError = ref<string | null>(null);
const saving = ref<boolean>(false);
const removing = ref<boolean>(false);

const isDraft = computed(() => props.status === DigitalProductDocumentStatusDto.Draft);
const hasIdentity = computed(() => identity.value !== undefined);
const digitalLink = computed(() => identity.value?.digitalLink);
const qrSize = computed(() => Math.min(windowHeight.value, windowWidth.value) * 0.4);

/**
 * Live client-side validation for an optional batch / serial: an empty value is
 * valid (it clears the component); a non-empty value must satisfy GS1 CSET-82 and
 * the 20-character cap. Returns a localized error message or null.
 */
function validateComponent(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return isValidCset82Component(trimmed) ? null : t("gs1.settings.componentInvalid");
}

const batchError = computed(() => validateComponent(batch.value));
const serialError = computed(() => validateComponent(serial.value));
const hasComponentError = computed(() => batchError.value !== null || serialError.value !== null);
const busy = computed(() => saving.value || removing.value);
const canSave = computed(
  () => isDraft.value && !busy.value && gtin.value.trim().length > 0 && !hasComponentError.value,
);
// Removal is offered only for a draft passport that actually has a stored GS1
// identity. A published passport's identity is frozen (non-removable).
const canRemove = computed(() => isDraft.value && hasIdentity.value && !busy.value);

watch(
  [() => props.passportId, model],
  async ([passportId, visible]) => {
    if (!passportId || !visible) return;
    gtinError.value = null;
    try {
      const result = await apiClient.dpp.passports.getGs1Identity(String(passportId));
      applyIdentity(result.data);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        // No GS1 identity yet — a fresh form.
        resetForm();
        return;
      }
      errorHandlingStore.logErrorWithNotification(t("gs1.settings.loadError"), e);
    }
  },
  { immediate: true },
);

function applyIdentity(data: Gs1IdentityResponse) {
  identity.value = data;
  gtin.value = data.gtin;
  batch.value = data.batch ?? "";
  serial.value = data.serial ?? "";
}

function resetForm() {
  identity.value = undefined;
  gtin.value = "";
  batch.value = "";
  serial.value = "";
}

async function save() {
  if (!props.passportId || hasComponentError.value) return;
  gtinError.value = null;
  saving.value = true;
  try {
    const result = await apiClient.dpp.passports.setGs1Identity(String(props.passportId), {
      gtin: gtin.value.trim(),
      batch: batch.value.trim(),
      serial: serial.value.trim(),
    });
    applyIdentity(result.data);
    emit("updated", result.data);
    notificationStore.addSuccessNotification(t("gs1.settings.saveSuccess"));
  } catch (e: unknown) {
    const status = isAxiosError(e) ? e.response?.status : undefined;
    if (status === 400) {
      gtinError.value = t("gs1.settings.gtinInvalid");
    } else if (status === 409) {
      gtinError.value = isDraft.value
        ? t("gs1.settings.gtinConflict")
        : t("gs1.settings.draftOnly");
    } else {
      errorHandlingStore.logErrorWithNotification(t("gs1.settings.saveError"), e);
    }
  } finally {
    saving.value = false;
  }
}

/**
 * Remove the passport's GS1 identity. Allowed only while the passport is a draft;
 * the backend rejects a removal on a published passport with 409 (the identity is
 * frozen once published).
 */
async function remove() {
  if (!props.passportId || !canRemove.value) return;
  gtinError.value = null;
  removing.value = true;
  try {
    await apiClient.dpp.passports.deleteGs1Identity(String(props.passportId));
    resetForm();
    emit("removed");
    notificationStore.addSuccessNotification(t("gs1.settings.removeSuccess"));
    model.value = false;
  } catch (e: unknown) {
    errorHandlingStore.logErrorWithNotification(t("gs1.settings.removeError"), e);
  } finally {
    removing.value = false;
  }
}

function cancel() {
  model.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('gs1.settings.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <Message v-if="!isDraft" severity="warn" :closable="false" data-testid="gs1-frozen-notice">
        {{ t("gs1.settings.frozenNotice") }}
      </Message>
      <p class="text-sm text-gray-600">{{ t("gs1.settings.description") }}</p>
      <div class="flex flex-col gap-2">
        <label for="gs1-gtin" class="text-sm leading-6 font-medium text-gray-900">{{
          t("gs1.settings.gtin.label")
        }}</label>
        <InputText
          id="gs1-gtin"
          v-model="gtin"
          data-testid="gs1-gtin-input"
          :placeholder="t('gs1.settings.gtin.placeholder')"
          :invalid="!!gtinError"
          :disabled="!isDraft || busy"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
        />
        <small v-if="gtinError" class="text-red-500" data-testid="gs1-gtin-error">{{
          gtinError
        }}</small>
        <small v-else-if="!isDraft" class="text-amber-700">{{ t("gs1.settings.draftOnly") }}</small>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <div class="flex flex-1 flex-col gap-2">
          <label for="gs1-batch" class="text-sm leading-6 font-medium text-gray-900">{{
            t("gs1.settings.batch.label")
          }}</label>
          <InputText
            id="gs1-batch"
            v-model="batch"
            data-testid="gs1-batch-input"
            :placeholder="t('gs1.settings.batch.placeholder')"
            :invalid="!!batchError"
            :disabled="!isDraft || busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="20"
          />
          <small v-if="batchError" class="text-red-500" data-testid="gs1-batch-error">{{
            batchError
          }}</small>
        </div>
        <div class="flex flex-1 flex-col gap-2">
          <label for="gs1-serial" class="text-sm leading-6 font-medium text-gray-900">{{
            t("gs1.settings.serial.label")
          }}</label>
          <InputText
            id="gs1-serial"
            v-model="serial"
            data-testid="gs1-serial-input"
            :placeholder="t('gs1.settings.serial.placeholder')"
            :invalid="!!serialError"
            :disabled="!isDraft || busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="20"
          />
          <small v-if="serialError" class="text-red-500" data-testid="gs1-serial-error">{{
            serialError
          }}</small>
        </div>
      </div>

      <div v-if="digitalLink" class="flex flex-col items-center gap-3">
        <QrCode :size="qrSize" :link="digitalLink" />
        <div class="flex w-full flex-col gap-1">
          <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">{{
            t("gs1.settings.digitalLink.label")
          }}</span>
          <a
            :href="digitalLink"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="gs1-digital-link"
            class="font-mono text-sm break-all text-blue-600"
          >
            {{ digitalLink }}
          </a>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500" data-testid="gs1-empty">
        {{ t("gs1.settings.empty") }}
      </div>
    </div>
    <template #footer>
      <Button
        v-if="canRemove"
        :label="t('common.remove')"
        data-testid="gs1-remove-btn"
        severity="danger"
        variant="text"
        @click="remove"
        :disabled="busy"
      />
      <Button
        :label="t('common.cancel')"
        severity="secondary"
        variant="text"
        @click="cancel"
        :disabled="busy"
      />
      <Button
        :label="t('common.save')"
        data-testid="gs1-save-btn"
        @click="save"
        :disabled="!canSave"
      />
    </template>
  </Dialog>
</template>
