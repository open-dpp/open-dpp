<script setup lang="ts">
import { PermalinkBaseUrlSchema } from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LockClosedIcon } from "@heroicons/vue/24/outline";

const model = defineModel<string | null>();
const props = defineProps<{
  loading: boolean;
  isLocked: boolean;
  isSaving: boolean;
  translationKey: string;
  effectiveFallback?: string;
}>();
const emit = defineEmits<{
  (e: "commit", value: string | null): void;
}>();

const { t } = useI18n();

const draft = ref<string>(model.value ?? "");

watch(
  () => model.value,
  (next) => {
    draft.value = next ?? "";
  },
);

const trimmed = computed(() => draft.value.trim());
const isEmpty = computed(() => trimmed.value.length === 0);
const validationError = computed<string | null>(() => {
  if (isEmpty.value) return null;
  const result = PermalinkBaseUrlSchema.safeParse(trimmed.value);
  return result.success
    ? null
    : t(`organizations.admin.instanceSettings.${props.translationKey}.invalid`);
});

function commit() {
  if (props.isLocked || props.isSaving) return;
  if (validationError.value) return;
  const next = isEmpty.value ? null : trimmed.value;
  const current = model.value ?? null;
  if (next === current) return;
  emit("commit", next);
}
</script>

<template>
  <Card v-if="!loading">
    <template #content>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col">
          <span class="font-medium">
            {{ t(`organizations.admin.instanceSettings.${translationKey}.title`) }}
          </span>
          <span class="text-sm text-gray-500">
            {{ t(`organizations.admin.instanceSettings.${translationKey}.description`) }}
          </span>
        </div>
        <InputText
          v-model="draft"
          :placeholder="t(`organizations.admin.instanceSettings.${translationKey}.placeholder`)"
          :disabled="isLocked || isSaving"
          :invalid="!!validationError"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          @blur="commit"
          @keyup.enter="commit"
        />
        <small v-if="validationError" class="text-red-500">{{ validationError }}</small>
        <small v-else-if="isEmpty && effectiveFallback" class="text-gray-500">
          {{
            t(`organizations.admin.instanceSettings.${translationKey}.effectiveFallback`, {
              url: effectiveFallback,
            })
          }}
        </small>
        <span v-if="isLocked" class="mt-1 flex items-center gap-1 text-sm text-amber-600">
          <LockClosedIcon class="size-4" />
          {{ t("organizations.admin.instanceSettings.lockedByEnv") }}
        </span>
      </div>
    </template>
  </Card>
</template>
