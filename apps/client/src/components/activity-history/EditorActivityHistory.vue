<script setup lang="ts">
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";
import { computed, onMounted } from "vue";
import {
  type ActivityDto,
  ActivityDtoTypes,
  ActivityPayloadDtoSchema,
  type ExtendedJsonPatchDtoOperation,
  type PagingParamsDto,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import MediaFieldView from "../media/MediaFieldView.vue";
import type { TimelineItem } from "../../composables/activity-timeline.ts";

dayjs.extend(utc);
const props = defineProps<{
  id: string;
  dppPath?: string;
  changePath?: string;
  type: DigitalProductDocumentTypeType;
  createTimelineItem: (
    activity: ActivityDto,
    change: ExtendedJsonPatchDtoOperation,
  ) => TimelineItem | undefined;
}>();

const { activities, fetchActivities } = useActivityHistory(props.type);

const route = useRoute();

const timelineItems = computed<TimelineItem[]>(() => {
  const result = [];
  for (const activity of activities.value) {
    const payloadParsing = ActivityPayloadDtoSchema.safeParse(activity.payload);
    if (payloadParsing.success) {
      for (const change of payloadParsing.data.changes) {
        const timelineItem = props.createTimelineItem(activity, change);
        if (timelineItem) {
          result.push(timelineItem);
        }
      }
    }
  }
  return result;
});

async function fetchCallback(pagingParams: PagingParamsDto) {
  console.log("fetchCallback", pagingParams);
  const response = await fetchActivities(props.id, pagingParams, {
    type: ActivityDtoTypes.SubmodelActivity,
    dppPath: props.dppPath,
    changePath: props.changePath,
  });

  activities.value = response.result;
  return response;
}

const { nextPage } = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams: () => {},
});

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <Timeline :value="timelineItems" align="alternate">
    <template #marker="slotProps">
      <span class="z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
        <i :class="slotProps.item.icon"></i>
      </span>
    </template>
    <template #content="slotProps">
      <Card class="mt-4">
        <template #title>{{ slotProps.item.title }}</template>
        <template #subtitle>
          {{ slotProps.item.timestamp }}
        </template>
        <template #content>
          <div
            v-for="(item, index) in slotProps.item.content"
            :key="index"
            class="flex flex-col gap-2"
          >
            <MediaFieldView v-if="item.renderContentAsFile" :media-id="item.value" />
            <p v-else>{{ item.value }}</p>
          </div>
        </template>
      </Card>
    </template>
  </Timeline>
</template>
