<script lang="ts" setup>
import { ArrowRightStartOnRectangleIcon } from "@heroicons/vue/16/solid";
import { computed, ref, useAttrs } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useErrorHandlingStore } from "../../../stores/error.handling";
import { useUniqueProductIdentifierStore } from "../../../stores/unique.product.identifier";

const props = defineProps<{ id: string; className?: string }>();
const router = useRouter();
const { t } = useI18n();
const inputValue = ref<string>("");

const uniqueProductIdentifierStore = useUniqueProductIdentifierStore();

const errorHandlingStore = useErrorHandlingStore();
const attrs = useAttrs() as Record<string, unknown>;
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

const computedAttrs = computed(() => ({
  ...attrs,
}));
</script>

<template>
  <div class="flex flex-row gap-2 items-center" :class="[props.className]">
    <FormKit
      v-model="inputValue"
      :data-cy="props.id"
      suffix-class="flex items-center pr-2"
      inner-class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300"
      v-bind="computedAttrs"
    >
      <template #suffix>
        <button
          type="button"
          :data-cy="`Visit ${props.id}`"
          class="p-1 cursor-pointer hover:text-indigo-500 text-indigo-600"
          @click="onLinkClick"
        >
          <ArrowRightStartOnRectangleIcon class="size-5" aria-hidden="true" />
        </button>
      </template>
    </FormKit>
  </div>
</template>
