<template>
  <div>
    <MetricQuery />
    <div class="h-[400px]">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Line } from 'vue-chartjs';

import { useAnalyticsStore } from '../../stores/analytics';
import { computed, ref } from 'vue';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import MetricQuery from '../../components/analytics/MetricQuery.vue';

const analyticsStore = useAnalyticsStore();

const data = computed(() => {
  const timeseries = analyticsStore.getMeasurementsAsTimeseries();
  return {
    labels: timeseries.map((t) => t.x),
    datasets: [
      {
        label: 'Seitenaufrufe',
        backgroundColor: '#f87979',
        data: timeseries.map((t) => t.y),
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
