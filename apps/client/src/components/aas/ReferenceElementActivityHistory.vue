<script setup lang="ts">
import {
  type ActivityDto,
  type JsonPatchOperationDto,
  type KeyDto,
  KeyTypes,
  ReferenceJsonSchema,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { useActivityTimelineRendering } from "../../composables/activity-timeline-rendering.ts";
import { z } from "zod";

dayjs.extend(utc);
const props = defineProps<{ id: string; path: AasEditorPath }>();

const activityTimelineRendering = useActivityTimelineRendering();

function formatValue(value: any) {
  const parsedResult = ReferenceJsonSchema.safeParse(value);
  if (parsedResult.success) {
    return parsedResult.data.keys.find((key: KeyDto) => key.type === KeyTypes.GlobalReference)
      ?.value;
  } else if (z.string().safeParse(value).success) {
    return value;
  }
  return undefined;
}

function createTimelineItem(activity: ActivityDto, change: JsonPatchOperationDto) {
  return activityTimelineRendering.createTimelineItem(activity, change, formatValue);
}
</script>

<template>
  <EditorActivityHistory :id="id" :path="props.path" :create-timeline-item="createTimelineItem" />
</template>
