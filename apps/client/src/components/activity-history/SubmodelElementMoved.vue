<script setup lang="ts">
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { makeSubmodelElement } from "../../lib/submodel-element.ts";
import SubmodelElementName from "./SubmodelElementName.vue";
import SubmodelElementType from "./SubmodelElementType.vue";

const props = defineProps<{
  oldPath: string;
  path: string;
  position: number;
  value: SubmodelElementResponseDto;
  activityCreatedAt: string;
}>();

const emit = defineEmits<{
  "view-history-before-move": [
    payload: { movedFromPath: string; movedToPath: string; dateOfMove: string },
  ];
}>();

const { t } = useI18n();

const pathChanged = computed(() => props.oldPath !== props.path);

function onViewHistoryBeforeMove() {
  const isContainer = makeSubmodelElement(props.value).isContainer();
  emit("view-history-before-move", {
    movedFromPath: isContainer ? `sw:${props.oldPath}` : props.oldPath,
    movedToPath: props.path,
    dateOfMove: props.activityCreatedAt,
  });
}
</script>

<template>
  <dl>
    <DescriptionTerm dt="ID">
      {{ props.value.idShort }}
    </DescriptionTerm>
    <SubmodelElementName :value="props.value" />
    <SubmodelElementType :value="props.value" />
    <DescriptionTerm :dt="t('activityHistory.position')">
      {{ props.position + 1 }}
    </DescriptionTerm>
  </dl>
  <IdShortPath :path="props.oldPath" :label="t('activityHistory.movedFrom')" />
  <IdShortPath :path="props.path" :label="t('activityHistory.movedTo')" />
  <Button
    v-if="pathChanged"
    link
    size="small"
    class="p-0!"
    :label="t('activityHistory.viewHistoryBeforeMove')"
    @click="onViewHistoryBeforeMove"
  />
</template>
