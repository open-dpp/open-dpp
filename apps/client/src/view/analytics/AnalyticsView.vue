<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import { computed, ref } from "vue";
import { Line } from "vue-chartjs";
import MetricQuery from "../../components/analytics/MetricQuery.vue";
import { useAnalyticsStore } from "../../stores/analytics";

const analyticsStore = useAnalyticsStore();

const data = computed(() => {
  const timeseries = analyticsStore.getMeasurementsAsTimeseries();
  return {
    labels: timeseries.map(t => t.x),
    datasets: [
      {
        label: "Seitenaufrufe",
        backgroundColor: "#f87979",
        data: timeseries.map(t => t.y),
      },
    ],
  };
});

//
const options = ref({
  responsive: true,
  maintainAspectRatio: false,
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
</script>

<template>
  <div>
    <MetricQuery />
    <div class="h-[400px]">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>
