<script setup lang="ts">
import { type DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import { onMounted } from "vue";
import { ChangeEventDtoTypes, type PagingParamsDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import PolicyModified from "./PolicyModified.vue";
import ReferenceElementValueChanged from "./ReferenceElementValueChanged.vue";

dayjs.extend(utc);
const props = defineProps<{
  id: string;
  path?: string;
  type: DigitalProductDocumentTypeType;
}>();

const { activities, fetchActivities } = useActivityHistory(props.type);

const route = useRoute();

async function fetchCallback(pagingParams: PagingParamsDto) {
  const response = await fetchActivities(props.id, pagingParams, {
    path: props.path,
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
const { t } = useI18n();

function filterChanges(changes: any[]) {
  return changes.filter((change) => {
    if (
      [ChangeEventDtoTypes.DisplayNameChanged, ChangeEventDtoTypes.DescriptionChanged].includes(
        change.type,
      )
    ) {
      return change.values.length > 0;
    }
    return true;
  });
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <Timeline :value="activities" align="alternate">
    <!--    <template #marker="slotProps">-->
    <!--      <span class="z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm">-->
    <!--        <i :class="slotProps.item.icon"></i>-->
    <!--      </span>-->
    <!--    </template>-->
    <template #content="slotProps">
      <Card class="mt-4">
        <template #title>{{ t(`activityHistory.types.${slotProps.item.header.type}`) }}</template>
        <template #subtitle>
          {{ dayjs(slotProps.item.header.createdAt).format("L LTS") }}
        </template>
        <template #content>
          <TimelineContentItem
            v-for="(change, index) in filterChanges(slotProps.item.payload.changes)"
            :key="index"
            class="flex flex-col gap-2"
            :change-type="change.type"
          >
            <DisplayNamedValueChanged
              v-if="change.type === ChangeEventDtoTypes.DisplayNameChanged"
              :values="change.values"
            />
            <PropertyValueChanged
              v-else-if="change.type === ChangeEventDtoTypes.PropertyValueChanged"
              :valueType="change.valueType"
              :oldValue="change.oldValue"
              :newValue="change.newValue"
            />
            <PolicyAdded
              v-else-if="change.type === ChangeEventDtoTypes.PolicyAdded"
              :memberRole="change.memberRole"
              :userRole="change.userRole"
              :value="change.value"
            />
            <PolicyModified
              v-else-if="change.type === ChangeEventDtoTypes.PolicyModified"
              :memberRole="change.memberRole"
              :userRole="change.userRole"
              :oldValue="change.oldValue"
              :newValue="change.newValue"
            />
            <ReferenceElementValueChanged
              v-else-if="change.type === ChangeEventDtoTypes.ReferenceElementValueChanged"
              :old-value="change.oldValue"
              :new-value="change.newValue"
            />
            <FileValueChanged
              v-else-if="change.type === ChangeEventDtoTypes.FileValueChanged"
              :old-value="change.oldValue"
              :new-value="change.newValue"
            />
          </TimelineContentItem>
        </template>
      </Card>
    </template>
  </Timeline>
</template>
