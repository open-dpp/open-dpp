<script setup lang="ts">
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";
import { computed, onMounted } from "vue";
import { ActivityDtoTypes, type PagingParamsDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useI18n } from "vue-i18n";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute, useRouter } from "vue-router";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
const props = defineProps<{ id: string; path: AasEditorPath }>();

const { activities, fetchActivities } = useActivityHistory(DigitalProductDocumentType.Passport);
const { t } = useI18n();

const route = useRoute();

const filteredActivities = computed(() => {
  const result = [];
  for (const activity of activities.value) {
    for (const change of activity.payload.changes) {
      result.push({
        id: activity.header.id,
        timestamp: dayjs(activity.header.createdAt).format("LLL"),
        attribute: change.path.endsWith("value") ? "Wert" : "Name",
        operation: change.op === "add" ? "hinzugefügt" : "geändert",
        value: change.value,
        icon: change.op === "add" ? "pi pi-plus" : "pi pi-pencil",
      });
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
  <Timeline :value="filteredActivities" align="alternate">
    <template #marker="slotProps">
      <span class="z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
        <i :class="slotProps.item.icon"></i>
      </span>
    </template>
    <template #content="slotProps">
      <Card class="mt-4">
        <template #title> {{ slotProps.item.attribute }} {{ slotProps.item.operation }} </template>
        <template #subtitle>
          {{ slotProps.item.timestamp }}
        </template>
        <template #content>
          <p>
            {{ slotProps.item.value }}
          </p>
        </template>
      </Card>
    </template>
  </Timeline>
</template>
