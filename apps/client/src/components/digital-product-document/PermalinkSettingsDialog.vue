<script lang="ts" setup>
import type { PermalinkPublicDto } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { usePermalinkPreview } from "../../composables/permalink-preview";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const model = defineModel<boolean>("visible");
const props = defineProps<{ passportId: string | undefined }>();
const emit = defineEmits<{ updated: [permalink: PermalinkPublicDto] }>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

const permalink = ref<PermalinkPublicDto | undefined>(undefined);
const slug = ref<string>("");
const baseUrl = ref<string>("");
const saving = ref<boolean>(false);
const slugError = ref<string | null>(null);
const baseUrlError = ref<string | null>(null);

const preview = usePermalinkPreview(permalink, slug, baseUrl);

watch(
  [() => props.passportId, model],
  async ([passportId, visible]) => {
    if (!passportId || !visible) return;
    try {
      const result = await apiClient.dpp.permalinks.getByPassport(String(passportId));
      const first = result.data[0];
      permalink.value = first;
      slug.value = first?.slug ?? "";
      baseUrl.value = first?.baseUrl ?? "";
      slugError.value = null;
      baseUrlError.value = null;
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(t("permalink.settings.loadError"), e);
    }
  },
  { immediate: true },
);

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function save() {
  if (!permalink.value) return;
  slugError.value = null;
  baseUrlError.value = null;
  saving.value = true;
  try {
    const result = await apiClient.dpp.permalinks.update(permalink.value.id, {
      slug: trimToNull(slug.value),
      baseUrl: trimToNull(baseUrl.value),
    });
    permalink.value = result.data;
    emit("updated", result.data);
    notificationStore.addSuccessNotification(t("permalink.settings.saveSuccess"));
    model.value = false;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 409) {
      slugError.value = t("permalink.settings.slugConflict");
    } else if (status === 400) {
      slugError.value = t("permalink.settings.slugInvalid");
      baseUrlError.value = t("permalink.settings.baseUrlInvalid");
    } else {
      errorHandlingStore.logErrorWithNotification(t("permalink.settings.saveError"), e);
    }
  } finally {
    saving.value = false;
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
    :header="t('permalink.settings.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <div v-if="!permalink" class="text-gray-500">{{ t("permalink.notfound") }}</div>
      <template v-else>
        <div class="flex flex-col gap-2">
          <label for="permalink-slug" class="text-sm leading-6 font-medium text-gray-900">{{
            t("permalink.settings.slug.label")
          }}</label>
          <InputText
            id="permalink-slug"
            v-model="slug"
            :placeholder="t('permalink.settings.slug.placeholder')"
            :invalid="!!slugError"
            autocomplete="off"
            spellcheck="false"
          />
          <small v-if="slugError" class="text-red-500">{{ slugError }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <label for="permalink-base-url" class="text-sm leading-6 font-medium text-gray-900">{{
            t("permalink.settings.baseUrl.label")
          }}</label>
          <small class="text-gray-700">{{ t("permalink.settings.baseUrl.description") }}</small>
          <InputText
            id="permalink-base-url"
            v-model="baseUrl"
            placeholder="https://passports.example.com"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            :invalid="!!baseUrlError"
          />
          <small v-if="baseUrlError" class="text-red-500">{{ baseUrlError }}</small>
        </div>
        <div class="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div class="text-xs font-medium tracking-wider text-gray-500 uppercase">
            {{ t("permalink.settings.preview.label") }}
          </div>
          <code v-if="preview.previewValid.value" class="mt-2 block font-mono text-sm break-all">
            <span class="text-gray-900">{{ preview.effectiveBase.value }}</span>
            <span class="text-gray-400">/p/</span>
            <span class="text-primary-600 font-medium">{{ preview.effectiveSlug.value }}</span>
          </code>
          <p v-else class="mt-2 text-sm text-gray-500 italic">
            {{ t("permalink.settings.preview.invalid") }}
          </p>
        </div>
      </template>
    </div>
    <template #footer>
      <Button
        :label="t('common.cancel')"
        severity="secondary"
        variant="text"
        @click="cancel"
        :disabled="saving"
      />
      <Button :label="t('common.save')" @click="save" :disabled="saving || !permalink" />
    </template>
  </Dialog>
</template>
