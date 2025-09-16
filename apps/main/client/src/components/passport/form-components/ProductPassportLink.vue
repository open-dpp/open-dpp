<template>
  <div :class="[props.className, 'flex flex-row gap-2 items-center']">
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

<script lang="ts" setup>
import { computed, ref, useAttrs } from "vue";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/vue/16/solid";
import { useRouter } from "vue-router";
import { useUniqueProductIdentifierStore } from "../../../stores/unique.product.identifier";
import { useErrorHandlingStore } from "../../../stores/error.handling";

const router = useRouter();

const inputValue = ref<string>("");

const uniqueProductIdentifierStore = useUniqueProductIdentifierStore();

const props = defineProps<{ id: string; className?: string }>();
const errorHandlingStore = useErrorHandlingStore();
const attrs = useAttrs() as Record<string, unknown>;
const onLinkClick = async () => {
  if (inputValue.value) {
    try {
      const link =
        await uniqueProductIdentifierStore.buildLinkToReferencedProduct(
          inputValue.value,
        );
      await router.push(link);
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(
        "Navigation zu Produktpass fehlgeschlagen",
        e,
      );
    }
  }
};

const computedAttrs = computed(() => ({
  ...attrs,
}));
</script>
