<script setup lang="ts">
import {
  type ActivityDto,
  type DataTypeDefType,
  type JsonPatchOperationDto,
  LanguageTextJsonSchema,
  OperationDtoTypes,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useI18n } from "vue-i18n";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { formatPropertyValue } from "../../lib/property-value.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import { useActivityTimelineRendering } from "../../composables/activity-timeline-rendering.ts";

dayjs.extend(utc);
const props = defineProps<{ id: string; path: AasEditorPath; valueType: DataTypeDefType }>();

const { locale } = useI18n();

const activityTimelineRendering = useActivityTimelineRendering();

function createTimelineItem(activity: ActivityDto, change: JsonPatchOperationDto) {
  return activityTimelineRendering.createTimelineItem(activity, change, (value) => ({
    value: formatPropertyValue(value, props.valueType, convertLocaleToLanguage(locale.value)),
  }));
}
</script>

<template>
  <EditorActivityHistory :id="id" :path="props.path" :create-timeline-item="createTimelineItem" />
</template>
