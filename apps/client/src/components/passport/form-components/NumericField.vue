<template>
  <div :class="props.className">
    <FormKit
      :data-cy="props.id"
      :max="(computedOptions?.max as number) ?? undefined"
      :min="(computedOptions?.min as number) ?? undefined"
      inner-class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300"
      number
      type="number"
      v-bind="computedAttrs"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue';

const props = defineProps<{ id: string; className?: string }>();

const attrs = useAttrs() as Record<string, unknown>;

const computedAttrs = computed(() => ({
  ...attrs,
}));

const computedOptions = computed(
  () => computedAttrs.value.options as Record<string, unknown>,
);
</script>
