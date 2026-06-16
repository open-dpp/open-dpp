<script lang="ts" setup>
import type { PermalinkPublicDto } from "@open-dpp/dto";
import { PermalinkKind } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { usePermalinkPreview } from "../../composables/permalink-preview";
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
const gs1ResolverBase = ref<string>("");
const gs1DataAttributes = ref<Record<string, string>>({});

const saving = ref(false);
const slugError = ref<string | null>(null);

// Wrap permalink prop in a ref for usePermalinkPreview
const permalinkRef = computed(() => props.permalink);

const preview = usePermalinkPreview(permalinkRef, slug, baseUrl);

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

const isGs1Link = computed(() => props.permalink.kind === PermalinkKind.GS1_LINK);
const locked = computed(() => Boolean(props.permalink.publishedUrl));

// ---------------------------------------------------------------------------
// Sync form state when permalink prop changes
// ---------------------------------------------------------------------------

watch(
  () => props.permalink,
  (pl) => {
    slug.value = pl.slug ?? "";
    baseUrl.value = pl.baseUrl ?? "";
    gs1ResolverBase.value = pl.gs1ResolverBase ?? "";
    gs1DataAttributes.value = pl.gs1DataAttributes ?? {};
    slugError.value = null;
  },
  { immediate: true },
);

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
          slug: trimToNull(slug.value),
          baseUrl: trimToNull(baseUrl.value),
          gs1ResolverBase: trimToNull(gs1ResolverBase.value),
          gs1DataAttributes:
            Object.keys(gs1DataAttributes.value).length > 0 ? gs1DataAttributes.value : null,
        }
      : {
          slug: trimToNull(slug.value),
          baseUrl: trimToNull(baseUrl.value),
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
      <!-- Locked banner -->
      <div
        v-if="locked"
        data-testid="permalink-edit-locked-banner"
        class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
      >
        {{ t("permalink.edit.locked") }}
      </div>

      <!-- Slug field (shown for both kinds) -->
      <div class="flex flex-col gap-2">
        <label for="permalink-edit-slug-input" class="text-sm font-medium leading-6 text-gray-900">
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
        <small
          v-if="slugError"
          data-testid="permalink-edit-slug-error"
          class="text-red-500"
        >
          {{ slugError }}
        </small>
      </div>

      <!-- BaseUrl field (shown for both kinds) -->
      <div class="flex flex-col gap-2">
        <label for="permalink-edit-base-url-input" class="text-sm font-medium leading-6 text-gray-900">
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
        <!-- GS1 Resolver Base URL -->
        <div class="flex flex-col gap-2">
          <label
            for="permalink-edit-gs1-resolver-base-input"
            class="text-sm font-medium leading-6 text-gray-900"
          >
            {{ t("permalink.edit.gs1ResolverBase.label") }}
          </label>
          <InputText
            id="permalink-edit-gs1-resolver-base-input"
            v-model="gs1ResolverBase"
            data-testid="permalink-edit-gs1-resolver-base"
            :placeholder="t('permalink.edit.gs1ResolverBase.placeholder')"
            :disabled="locked"
            autocomplete="off"
          />
        </div>

        <!-- GS1 Data Attributes -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium leading-6 text-gray-900">
            {{ t("permalink.edit.gs1DataAttributes") }}
          </label>
          <Gs1DataAttributesField
            v-model="gs1DataAttributes"
            data-testid="permalink-edit-gs1-data-attributes"
          />
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
        :disabled="locked || saving"
        @click="save"
      />
    </template>
  </Dialog>
</template>
