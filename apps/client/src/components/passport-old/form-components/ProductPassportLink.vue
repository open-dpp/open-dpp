<script lang="ts" setup>
import { ArrowRightStartOnRectangleIcon } from "@heroicons/vue/16/solid";
import InputText from "primevue/inputtext";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useErrorHandlingStore } from "../../../stores/error.handling";
import { useUniqueProductIdentifierStore } from "../../../stores/unique.product.identifier";

const props = defineProps<{
  id: string;
  className?: string;
  label?: string;
  modelValue?: string;
  required?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const router = useRouter();
const { t } = useI18n();
const inputValue = ref<string>(props.modelValue || "");

watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal || "";
});

watch(inputValue, (newVal) => {
  emit("update:modelValue", newVal);
});

const uniqueProductIdentifierStore = useUniqueProductIdentifierStore();

const errorHandlingStore = useErrorHandlingStore();

async function onLinkClick() {
  if (inputValue.value) {
    try {
      const link
        = await uniqueProductIdentifierStore.buildLinkToReferencedProduct(
          inputValue.value,
        );
      await router.push(link);
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(
        t("models.form.link.navigationError"),
        e,
      );
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-2" :class="props.className">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-900 dark:text-white"
    >{{ label }}</label>
    <div class="flex shadow-sm rounded-md">
      <InputText
        :id="id"
        v-model="inputValue"
        :data-cy="props.id"
        class="block w-full min-w-0 flex-1 rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        :required="required"
      />
      <button
        type="button"
        :data-cy="`Visit ${props.id}`"
        class="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
        @click="onLinkClick"
      >
        <ArrowRightStartOnRectangleIcon class="size-5 text-gray-400" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
