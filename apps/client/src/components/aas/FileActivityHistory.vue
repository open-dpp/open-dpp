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
  if (z.string().safeParse(value).success) {
    return value;
  }
  return undefined;
}

function createTimelineItem(activity: ActivityDto, change: JsonPatchOperationDto) {
  if (change.path.endsWith("/contentType")) {
    return undefined;
  }
  return activityTimelineRendering.createTimelineItem(activity, change, (value) => ({
    value: formatValue(value),
    renderValueAsFile: true,
  }));
}
</script>

<template>
  <EditorActivityHistory :id="id" :path="props.path" :create-timeline-item="createTimelineItem" />
</template>
