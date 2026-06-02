<script setup lang="ts">
import { type DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import { onMounted } from "vue";
import { type PagingParamsDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useActivityHistory } from "../../composables/activity-history.ts";
import { usePagination } from "../../composables/pagination.ts";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

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
        <template #title>{{ t(`activityHistory.types.${slotProps.item.type}`) }}</template>
        <template #subtitle>
          {{ slotProps.item.timestamp }}
        </template>
        <!--        <template #content>-->
        <!--          <div-->
        <!--            v-for="(item, index) in slotProps.item.content"-->
        <!--            :key="index"-->
        <!--            class="flex flex-col gap-2"-->
        <!--          >-->
        <!--            <MediaFieldView v-if="item.renderContentAsFile" :media-id="item.value" />-->
        <!--            <p v-else>{{ item.value }}</p>-->
        <!--          </div>-->
        <!--        </template>-->
      </Card>
    </template>
  </Timeline>
</template>
