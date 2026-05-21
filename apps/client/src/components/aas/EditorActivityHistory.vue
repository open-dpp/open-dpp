<script setup lang="ts">
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";
import { computed, onMounted } from "vue";
import {
  type ActivityDto,
  ActivityDtoTypes,
  type DataTypeDefType,
  type JsonPatchOperationDto,
  LanguageTextJsonSchema,
  OperationDtoTypes,
  type PagingParamsDto,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useI18n } from "vue-i18n";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { formatPropertyValue } from "../../lib/property-value.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import MediaFieldView from "../media/MediaFieldView.vue";
import type { TimelineItem } from "../../composables/activity-timeline.ts";

dayjs.extend(utc);
const props = defineProps<{
  id: string;
  dppKey: string;
  createTimelineItem: (
    activity: ActivityDto,
    change: JsonPatchOperationDto,
  ) => TimelineItem | undefined;
}>();

const { activities, fetchActivities } = useActivityHistory(DigitalProductDocumentType.Passport);
const { t } = useI18n();

const route = useRoute();

const timelineItems = computed<TimelineItem[]>(() => {
  const result = [];
  for (const activity of activities.value) {
    for (const change of activity.payload.changes) {
      const timelineItem = props.createTimelineItem(activity, change);
      if (timelineItem) {
        result.push(timelineItem);
      }
    }
  }
  return result;
});

async function fetchCallback(pagingParams: PagingParamsDto) {
  const response = await fetchActivities(props.id, pagingParams, {
    type: ActivityDtoTypes.SubmodelActivity,
    dppKey: props.dppKey,
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
        <template #title>{{ slotProps.item.attribute }} {{ slotProps.item.operation }}</template>
        <template #subtitle>
          {{ slotProps.item.timestamp }}
        </template>
        <template #content v-if="slotProps.item.value">
          <MediaFieldView
            v-if="slotProps.item.renderValueAsFile"
            :media-id="slotProps.item.value"
          />
          <p v-else>{{ t("activityHistory.value") }} {{ slotProps.item.value }}</p>
        </template>
      </Card>
    </template>
  </Timeline>
</template>
