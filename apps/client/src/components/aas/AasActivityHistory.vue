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
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useI18n } from "vue-i18n";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import { formatPropertyValue } from "../../lib/property-value.ts";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import { getCurrentTimezone } from "../../lib/date-value.ts";

dayjs.extend(utc);
const props = defineProps<{ id: string; path: AasEditorPath; valueType: DataTypeDefType }>();

const { activities, fetchActivities } = useActivityHistory(DigitalProductDocumentType.Passport);
const { t, locale } = useI18n();

const route = useRoute();

type TimelineItem = {
  id: string;
  timestamp: string;
  attribute: string;
  operation: string;
  value: string | undefined;
  icon: string;
};

function createTimelineItem(activity: ActivityDto, change: JsonPatchOperationDto): TimelineItem {
  const id = activity.header.id;
  const timestamp = dayjs(activity.header.createdAt).format("LLL");
  const operation = t(`activityHistory.operations.${change.op}`);
  const valueAttr = t("aasEditor.formLabels.value");
  const nameAttr = t("aasEditor.formLabels.name");

  if (change.op === OperationDtoTypes.Remove) {
    return {
      id,
      timestamp,
      attribute: change.path.endsWith("value") ? valueAttr : nameAttr,
      operation,
      value: undefined,
      icon: "pi pi-trash",
    };
  } else if (change.op === OperationDtoTypes.Add) {
    const nameParsingResult = LanguageTextJsonSchema.safeParse(change.value);
    const value = nameParsingResult.success ? nameParsingResult.data.text : change.value;
    return {
      id,
      timestamp,
      attribute: valueAttr,
      operation,
      value,
      icon: "pi pi-plus",
    };
  } else {
    return {
      id,
      timestamp,
      attribute: change.path.endsWith("value") ? valueAttr : nameAttr,
      operation,
      value: formatPropertyValue(
        change.value,
        props.valueType,
        convertLocaleToLanguage(locale.value),
      ),
      icon: "pi pi-pencil",
    };
  }
}
const timelineItems = computed<TimelineItem[]>(() => {
  const result = [];
  for (const activity of activities.value) {
    for (const change of activity.payload.changes) {
      result.push(createTimelineItem(activity, change));
    }
  }
  return result;
});

async function fetchCallback(pagingParams: PagingParamsDto) {
  const response = await fetchActivities(props.id, pagingParams, {
    type: ActivityDtoTypes.SubmodelActivity,
    dppKey: props.path.idShortPath,
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
        <template #title>{{ slotProps.item.attribute }} {{ slotProps.item.operation }} </template>
        <template #subtitle>
          {{ slotProps.item.timestamp }}
        </template>
        <template #content v-if="slotProps.item.value">
          <p>{{ t("activityHistory.value") }} {{ slotProps.item.value }}</p>
        </template>
      </Card>
    </template>
  </Timeline>
</template>
