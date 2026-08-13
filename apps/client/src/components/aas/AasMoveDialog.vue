<script setup lang="ts">
import type { SubmodelResponseDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import type {
  ClassifyIdShortPathNode,
  IdShortPathPointer,
} from "../../lib/id-short-path-select.ts";
import IdShortPathSelect from "./IdShortPathSelect.vue";

const visible = defineModel<boolean>("visible", { required: true });
const selected = defineModel<IdShortPathPointer | null>("selected", { required: true });

const props = defineProps<{
  submodels: SubmodelResponseDto[];
  classify: ClassifyIdShortPathNode;
  confirm: () => Promise<void>;
}>();

const { t } = useI18n();

function cancel() {
  visible.value = false;
}
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="t('common.moveTo')" style="width: 30rem">
    <IdShortPathSelect
      v-model="selected"
      :submodels="props.submodels"
      :classify="props.classify"
      :label="t('common.moveTo')"
    />
    <div class="mt-4 flex justify-end gap-2">
      <Button type="button" :label="t('common.cancel')" severity="secondary" @click="cancel" />
      <Button
        type="button"
        :label="t('common.move')"
        :disabled="!selected"
        @click="props.confirm"
      />
    </div>
  </Dialog>
</template>
