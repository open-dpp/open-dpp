<script setup lang="ts">
import { DataTypeDefEnum, KeyTypesEnum, type SubmodelElementResponseDto } from "@open-dpp/dto";
import SubmodelElementName from "./SubmodelElementName.vue";
import { useI18n } from "vue-i18n";
import { getVisualType } from "../../lib/aas-editor.ts";

const props = defineProps<{
  idShort: string;
  value: SubmodelElementResponseDto;
}>();
const { t } = useI18n();
</script>

<template>
  <dl>
    <DescriptionTerm dt="ID">
      {{ props.value.idShort }}
    </DescriptionTerm>
    <SubmodelElementName :value="props.value" />
    <DescriptionTerm :dt="t('activityHistory.type')">
      {{
        getVisualType(
          KeyTypesEnum.parse(props.value.modelType),
          DataTypeDefEnum.optional().parse(props.value.valueType),
          t,
        )
      }}
    </DescriptionTerm>
  </dl>
</template>
