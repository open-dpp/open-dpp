<script setup lang="ts">
import { type DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import { onMounted } from "vue";
import {
  ActivityDtoTypes,
  type ActivityDtoTypesType,
  ChangeEventDtoTypes,
  type PagingParamsDto,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import PolicyModified from "./PolicyModified.vue";
import ReferenceElementValueChanged from "./ReferenceElementValueChanged.vue";
import RowAddedOrDeleted from "./RowAddedOrDeleted.vue";
import ColumnAddedOrDeleted from "./ColumnAddedOrDeleted.vue";
import SubmodelElementAddedOrDeleted from "./SubmodelElementAddedOrDeleted.vue";

import PolicyDeleted from "./PolicyDeleted.vue";

dayjs.extend(utc);
const props = defineProps<{
  id: string;
  path?: string;
  type: DigitalProductDocumentTypeType;
  filterByActivityType?: ActivityDtoTypesType[];
}>();

const { activities, fetchActivities } = useActivityHistory(props.type);

const route = useRoute();

async function fetchCallback(pagingParams: PagingParamsDto) {
  const response = await fetchActivities(props.id, pagingParams, {
    path: props.path,
    type: props.filterByActivityType,
  });

  activities.value = response.result;
  return response;
}

const { nextPage, reloadCurrentPage } = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams: () => {},
});
const { t } = useI18n();

function filterChanges(changes: any[], activityType: ActivityDtoTypesType) {
  if (activityType === ActivityDtoTypes.ColumnModified) {
    return changes.slice(0, 1);
  }
  if (activityType === ActivityDtoTypes.SubmodelAdded) {
    return changes.filter(
      (change) =>
        ![
          ChangeEventDtoTypes.SubmodelReferenceAdded,
          ChangeEventDtoTypes.AddedSubmodelToEnv,
        ].includes(change.type),
    );
  }
  if (activityType === ActivityDtoTypes.SubmodelDeleted) {
    return changes.filter(
      (change) =>
        ![
          ChangeEventDtoTypes.SubmodelReferenceDeleted,
          ChangeEventDtoTypes.DeletedSubmodelFromEnv,
        ].includes(change.type),
    );
  }
  return changes;
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <Toolbar>
      <template #start>
        <Button @click="reloadCurrentPage" :aria-label="t('common.refresh')" icon="pi pi-refresh" />
      </template>
    </Toolbar>
    <Timeline :value="activities" align="left">
      <template #opposite="slotProps">
        {{ dayjs(slotProps.item.header.createdAt).format("L LTS") }}
      </template>
      <template #content="slotProps">
        <Card class="mt-4">
          <template #title
            >{{ t(`activityHistory.timelineTitle`) }}: {{ slotProps.item.header.type }}</template
          >
          <template #subtitle
            >{{ t(`activityHistory.userId`) }}: {{ slotProps.item.header.userId }}</template
          >
          <template #content>
            <TimelineContentItem
              v-for="(change, index) in filterChanges(
                slotProps.item.payload.changes,
                slotProps.item.header.type,
              )"
              :key="index"
              class="flex flex-col gap-2"
              :change-type="change.type"
            >
              <LanguageTextsChanged
                v-if="
                  change.type === ChangeEventDtoTypes.DisplayNameChanged ||
                  change.type === ChangeEventDtoTypes.DescriptionChanged
                "
                :path="change.path"
                :values="change.values"
              />
              <PropertyValueChanged
                v-else-if="change.type === ChangeEventDtoTypes.PropertyValueChanged"
                :valueType="change.valueType"
                :path="change.path"
                :oldValue="change.oldValue"
                :newValue="change.newValue"
              />
              <ReferenceElementValueChanged
                v-else-if="change.type === ChangeEventDtoTypes.ReferenceElementValueChanged"
                :old-value="change.oldValue"
                :new-value="change.newValue"
                :path="change.path"
              />
              <FileValueChanged
                v-else-if="change.type === ChangeEventDtoTypes.FileValueChanged"
                :old-value="change.oldValue"
                :new-value="change.newValue"
                :path="change.path"
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
              <PolicyDeleted
                v-else-if="change.type === ChangeEventDtoTypes.PolicyDeleted"
                :memberRole="change.memberRole"
                :userRole="change.userRole"
              />
              <RowAddedOrDeleted
                v-else-if="
                  change.type === ChangeEventDtoTypes.RowAdded ||
                  change.type === ChangeEventDtoTypes.RowDeleted
                "
                :position="change.position"
                :value="change.value"
              />
              <ColumnAddedOrDeleted
                v-else-if="
                  change.type === ChangeEventDtoTypes.ColumnAdded ||
                  change.type === ChangeEventDtoTypes.ColumnDeleted
                "
                :position="change.position"
                :value="change.value"
              />
              <SubmodelElementAddedOrDeleted
                v-else-if="
                  change.type === ChangeEventDtoTypes.SubmodelElementAdded ||
                  change.type === ChangeEventDtoTypes.SubmodelElementDeleted
                "
                :id-short="change.value.idShort"
                :value="change.value"
              />
            </TimelineContentItem>
          </template>
        </Card>
      </template>
    </Timeline>
  </div>
</template>
