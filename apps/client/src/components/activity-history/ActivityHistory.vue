<script setup lang="ts">
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { type DigitalProductDocumentTypeType } from "../../lib/digital-product-document.ts";
import { onMounted, ref } from "vue";
import type { ActivityDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import apiClient from "../../lib/api-client.ts";
dayjs.extend(utc);
dayjs.extend(localizedFormat);
const props = defineProps<{ id: string; type: DigitalProductDocumentTypeType }>();

const { getActivities } = useDigitalProductDocument(props.type);
const activities = ref<ActivityDto[]>([]);

const downloadZip = async (activityDto: ActivityDto) => {
  const response = await apiClient.dpp.passports.downloadActivities(props.id, {
    pagination: {},
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", "activities.zip");
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const downloadJson = (activityDto: ActivityDto) => {
  const dataStr = JSON.stringify(activityDto.payload, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${dayjs(activityDto.header.createdAt).format("LLL")}_${activityDto.header.aggregateId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

onMounted(async () => {
  activities.value = (await getActivities(props.id)).result;
});
</script>

<template>
  <DataTable :value="activities" tableStyle="min-width: 50rem">
    <Column field="header.createdAt" header="Created at">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.header.createdAt).format("LLL") }}
        </p>
      </template>
    </Column>
    <Column>
      <template #body="{ data }">
        <Button label="Download" @click="downloadJson(data)" />
      </template>
    </Column>
  </DataTable>
</template>
