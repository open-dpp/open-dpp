<template>
  <UnderConstruction :show-preview="true">
    <!-- Stats Overview -->
    <div
      class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6 lg:px-8"
    >
      <div
        v-for="stat in stats"
        :key="stat.name"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <component
                :is="stat.icon"
                class="h-6 w-6 text-GJDarkGreen"
                aria-hidden="true"
              />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {{ stat.name }}
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stat.value }}
                  </div>
                  <div
                    :class="[
                      stat.changeType === 'increase'
                        ? 'text-green-600'
                        : 'text-red-600',
                      'ml-2 flex items-baseline text-sm font-semibold',
                    ]"
                  >
                    <component
                      :is="
                        stat.changeType === 'increase'
                          ? 'ArrowUpIcon'
                          : 'ArrowDownIcon'
                      "
                      class="h-4 w-4 flex-shrink-0 self-center"
                      aria-hidden="true"
                    />
                    <span class="ml-1">{{ stat.change }}</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div
      class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 px-4 sm:px-6 lg:px-8"
    >
      <!-- Sustainability Metrics -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Die Top 4 der nachhaltigen Materialien
        </h3>
        <div class="space-y-4">
          <div
            v-for="material in sustainableMaterials"
            :key="material.name"
            class="flex items-center"
          >
            <span class="flex-1 text-sm text-gray-600">{{
              material.name
            }}</span>
            <div class="flex-1">
              <div
                class="relative h-4 bg-gray-100 rounded-full overflow-hidden"
              >
                <div
                  class="absolute h-full bg-GJDarkGreen opacity-75"
                  :style="{ width: `${material.percentage}%` }"
                ></div>
              </div>
            </div>
            <span class="ml-4 text-sm text-gray-600"
              >{{ material.percentage }}%</span
            >
          </div>
        </div>
      </div>

      <!-- Compliance Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Compliance Status
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="status in complianceStatus"
            :key="status.name"
            class="bg-gray-50 p-4 rounded-lg"
          >
            <dt class="text-sm font-medium text-gray-500">{{ status.name }}</dt>
            <dd class="mt-1 text-3xl font-semibold text-GJDarkGreen">
              {{ status.value }}%
            </dd>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="mt-8 px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div class="flow-root">
            <ul role="list" class="-mb-8">
              <li
                v-for="(activity, activityIdx) in recentActivity"
                :key="activity.id"
              >
                <div class="relative pb-8">
                  <span
                    v-if="activityIdx !== recentActivity.length - 1"
                    class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                  <div class="relative flex space-x-3">
                    <div>
                      <span
                        :class="[
                          activity.type === 'creation'
                            ? 'bg-green-500'
                            : 'bg-blue-500',
                          'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                        ]"
                      >
                        <component
                          :is="activity.icon"
                          class="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <div
                      class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5"
                    >
                      <div>
                        <p class="text-sm text-gray-500">
                          {{ activity.content }}
                        </p>
                      </div>
                      <div
                        class="whitespace-nowrap text-right text-sm text-gray-500"
                      >
                        <time :datetime="activity.datetime">{{
                          activity.date
                        }}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </UnderConstruction>
</template>

<script lang="ts" setup>
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CircleStackIcon,
  DocumentCheckIcon,
  DocumentPlusIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';
import UnderConstruction from './UnderConstruction.vue';

const stats = [
  {
    name: 'Anzahl Produktpässe',
    value: '3,721',
    change: '12%',
    changeType: 'increase',
    icon: DocumentCheckIcon,
  },
  {
    name: 'Produktpässe im Umlauf',
    value: '2,834',
    change: '7%',
    changeType: 'increase',
    icon: CircleStackIcon,
  },
  {
    name: 'EU-Konformitätsrate',
    value: '94.2%',
    change: '3%',
    changeType: 'increase',
    icon: CheckCircleIcon,
  },
  {
    name: 'Tägliche Kunden Interaktionen',
    value: '847',
    change: '2%',
    changeType: 'decrease',
    icon: UserGroupIcon,
  },
];

const sustainableMaterials = [
  { name: 'Recyceltes Plastik', percentage: 85 },
  { name: 'Nachwachsendes Holz', percentage: 72 },
  { name: 'Organische Materialien', percentage: 64 },
  { name: 'Biologisch abbaubare Komponenten', percentage: 58 },
];

const complianceStatus = [
  { name: 'EU-Konformität', value: 98 },
  { name: 'Datenvollständigkeit', value: 87 },
  { name: 'Nachvollziebarkeit der Materialien', value: 92 },
  { name: 'Tracking des CO2-Fußabdrucks', value: 76 },
];

const recentActivity = [
  {
    id: 1,
    content: 'Neuer Produktpass für „Umweltfreundlichen Bürostuhl“ erstellt',
    type: 'creation',
    icon: DocumentPlusIcon,
    date: 'vor 20 Minuten',
    datetime: '2024-01-20T13:00',
  },
  {
    id: 2,
    content:
      'Aktualisierte Nachhaltigkeitskennzahlen für „Bamboo Desk Series“.',
    type: 'update',
    icon: ArrowPathIcon,
    date: 'vor 2 Stunden',
    datetime: '2024-01-20T11:00',
  },
  {
    id: 3,
    content:
      'Prüfung der Einhaltung der Vorschriften für die „Recycled Plastic Container Line“ abgeschlossen',
    type: 'check',
    icon: CheckCircleIcon,
    date: 'vor 5 Stunden',
    datetime: '2024-01-20T08:00',
  },
  {
    id: 4,
    content:
      'Materialzusammensetzung für „Smart LED Lighting System“ aktualisiert',
    type: 'update',
    icon: ArrowPathIcon,
    date: 'vor 1 Tag',
    datetime: '2024-01-19T15:00',
  },
];
</script>
