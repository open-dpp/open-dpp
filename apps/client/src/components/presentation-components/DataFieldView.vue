<template>
  <div
    :data-cy="props.fieldView.dataField.id"
    class="px-4 py-6 sm:col-span-1 sm:px-0 m-2"
  >
    <dt class="text-sm/6 font-medium text-gray-900">
      {{ props.fieldView.dataField.name }}
    </dt>
    <dd class="mt-1 text-sm/6 text-gray-700 sm:mt-2">
      <DataValue :field-view="props.fieldView" />
    </dd>
  </div>
</template>

<script setup lang="ts">
import { FieldView } from '../../lib/field-view';
import DataValue from './DataValue.vue';

const props = defineProps<{ fieldView: FieldView }>();
</script>
