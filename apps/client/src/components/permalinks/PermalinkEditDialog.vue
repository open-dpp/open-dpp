<script lang="ts" setup>
import type { PermalinkPublicDto, PresentationConfigurationDto } from "@open-dpp/dto";
import { PermalinkKind } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { useGs1LinkPreview } from "../../composables/permalink-preview";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";
import Gs1DataAttributesField from "./Gs1DataAttributesField.vue";

// ---------------------------------------------------------------------------
// Props / emits / model
// ---------------------------------------------------------------------------

const model = defineModel<boolean>("visible");

const props = defineProps<{
  permalink: PermalinkPublicDto;
}>();

const emit = defineEmits<{
  updated: [permalink: PermalinkPublicDto];
}>();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

const slug = ref<string>("");
const baseUrl = ref<string>("");
const selectedConfigId = ref<string | undefined>(undefined);
const configs = ref<PresentationConfigurationDto[]>([]);
const gs1DataAttributes = ref<Record<string, string>>({});
// Save is blocked while the attributes field holds an invalid or partial row —
// gs1DataAttributes then still carries the last valid map, and saving it would
// silently persist stale data (audit M5).
const gs1AttributesValid = ref(true);

const saving = ref(false);
const slugError = ref<string | null>(null);

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

const isGs1Link = computed(() => props.permalink.kind === PermalinkKind.GS1_LINK);
const typeLabel = computed(() =>
  isGs1Link.value ? t("permalink.edit.type.gs1Link") : t("permalink.edit.type.presentation"),
);
const locked = computed(() => Boolean(props.permalink.publishedUrl));

// Live GS1 Digital Link preview — reflects base-URL and data-attribute edits as
// they happen, matching the URL the backend will freeze on publish.
const { previewUrl: gs1PreviewUrl } = useGs1LinkPreview(
  computed(() => props.permalink),
  baseUrl,
  gs1DataAttributes,
);

// ---------------------------------------------------------------------------
// Sync form state when permalink prop changes
// ---------------------------------------------------------------------------

watch(
  () => props.permalink,
  (pl) => {
    slug.value = pl.slug ?? "";
    baseUrl.value = pl.baseUrl ?? "";
    selectedConfigId.value = pl.presentationConfigurationId ?? undefined;
    gs1DataAttributes.value = pl.gs1DataAttributes ?? {};
    slugError.value = null;
  },
  { immediate: true },
);

// The config picker (open-dpp kind, pre-freeze rebind) — loaded lazily when the
// dialog opens; the permalink's own passportId scopes the list.
watch(
  model,
  async (visible) => {
    if (!visible || isGs1Link.value || locked.value) return;
    try {
      const response = await apiClient.dpp.passports.presentationConfiguration.list(
        props.permalink.passportId,
      );
      configs.value = response.data ?? [];
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(t("permalink.edit.saveError"), e);
    }
  },
  { immediate: true },
);

function configLabel(config: PresentationConfigurationDto): string {
  return config.label ?? config.id;
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function save() {
  if (locked.value) return;
  slugError.value = null;
  saving.value = true;
  try {
    const body = isGs1Link.value
      ? {
          // A GS1 Digital Link has no slug ("Short name") — only a custom base URL.
          baseUrl: trimToNull(baseUrl.value),
          gs1DataAttributes:
            Object.keys(gs1DataAttributes.value).length > 0 ? gs1DataAttributes.value : null,
        }
      : {
          slug: trimToNull(slug.value),
          baseUrl: trimToNull(baseUrl.value),
          // Pre-freeze config rebind; clearing the select rebinds to the standard view.
          presentationConfigurationId: selectedConfigId.value ?? null,
        };

    const result = await apiClient.dpp.permalinks.updateById(props.permalink.id, body);
    emit("updated", result.data as PermalinkPublicDto);
    notificationStore.addSuccessNotification(t("permalink.edit.saveSuccess"));
    model.value = false;
  } catch (e: unknown) {
    if (isAxiosError(e) && e.response?.status === 409) {
      slugError.value = t("permalink.edit.slugConflict");
    } else {
      errorHandlingStore.logErrorWithNotification(t("permalink.edit.saveError"), e);
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
    :header="t('permalink.edit.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div class="flex flex-col gap-4">
      <!-- Type (read-only) -->
      <div class="flex flex-col gap-1" data-testid="permalink-edit-type">
        <span class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.edit.type.label") }}
        </span>
        <span class="text-sm text-gray-600" data-testid="permalink-edit-type-value">
          {{ typeLabel }}
        </span>
      </div>

      <!-- Locked banner -->
      <div
        v-if="locked"
        data-testid="permalink-edit-locked-banner"
        class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
      >
        {{ t("permalink.edit.locked") }}
      </div>

      <!-- Slug field — presentation only; a GS1 Digital Link has no "Short name" -->
      <div v-if="!isGs1Link" class="flex flex-col gap-2">
        <label for="permalink-edit-slug-input" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.edit.slug.label") }}
        </label>
        <InputText
          id="permalink-edit-slug-input"
          v-model="slug"
          data-testid="permalink-edit-slug"
          :placeholder="t('permalink.edit.slug.placeholder')"
          :invalid="!!slugError"
          :disabled="locked"
          autocomplete="off"
        />
        <small v-if="slugError" data-testid="permalink-edit-slug-error" class="text-red-500">
          {{ slugError }}
        </small>
      </div>

      <!-- Presentation configuration (open-dpp only; pre-freeze rebind) -->
      <div v-if="!isGs1Link" class="flex flex-col gap-2">
        <label for="permalink-edit-config" class="text-sm leading-6 font-medium text-gray-900">
          {{ t("permalink.edit.config.label") }}
        </label>
        <Select
          id="permalink-edit-config"
          v-model="selectedConfigId"
          data-testid="permalink-edit-config-select"
          :options="configs"
          option-value="id"
          :option-label="configLabel"
          :placeholder="t('permalink.edit.config.placeholder')"
          :disabled="locked || saving"
          show-clear
        />
      </div>

      <!-- Custom base URL — shown for both permalink kinds -->
      <div class="flex flex-col gap-2">
        <label
          for="permalink-edit-base-url-input"
          class="text-sm leading-6 font-medium text-gray-900"
        >
          {{ t("permalink.edit.baseUrl.label") }}
        </label>
        <InputText
          id="permalink-edit-base-url-input"
          v-model="baseUrl"
          data-testid="permalink-edit-base-url"
          inputmode="url"
          autocomplete="off"
          :disabled="locked"
        />
      </div>

      <!-- GS1-link-only fields -->
      <template v-if="isGs1Link">
        <!-- GS1 Data Attributes -->
        <div class="flex flex-col gap-2">
          <label class="text-sm leading-6 font-medium text-gray-900">
            {{ t("permalink.edit.gs1DataAttributes") }}
          </label>
          <Gs1DataAttributesField
            v-model="gs1DataAttributes"
            data-testid="permalink-edit-gs1-data-attributes"
            @update:valid="gs1AttributesValid = $event"
          />
        </div>

        <!-- Live GS1 Digital Link preview -->
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
            {{ t("permalink.edit.gs1Preview.label") }}
          </span>
          <span
            data-testid="permalink-edit-gs1-preview"
            class="font-mono text-sm break-all text-blue-600"
          >
            {{ gs1PreviewUrl }}
          </span>
        </div>
      </template>
    </div>

    <template #footer>
      <Button
        :label="t('common.cancel')"
        severity="secondary"
        variant="text"
        :disabled="saving"
        @click="cancel"
      />
      <Button
        :label="t('common.save')"
        data-testid="permalink-edit-save"
        :disabled="locked || saving || (isGs1Link && !gs1AttributesValid)"
        @click="save"
      />
    </template>
  </Dialog>
</template>
