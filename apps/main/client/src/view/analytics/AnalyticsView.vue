<template>
  <div>
    <MetricQuery />
    <div
      v-for="(
        passportMeasurement, index
      ) of analyticsStore.passportMeasurements"
      :key="index"
    >
      <div>{{ passportMeasurement.datetime }}</div>
      <div>{{ passportMeasurement.sum }}</div>
    </div>
    <div class="h-[400px]">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Line } from 'vue-chartjs';

import { useAnalyticsStore } from '../../stores/analytics';
import { ref } from 'vue';
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

const data = ref({
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Seitenaufrufe',
      backgroundColor: '#f87979',
      data: [102, 39, 230, 301, 80, 303, 98],
    },
  ],
});

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
