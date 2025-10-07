<script setup lang="ts">
import { ref } from "vue";
import UnderConstruction from "./UnderConstruction.vue";

interface Integration {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  icon: string;
  lastSync?: string;
}

const integrations = ref<Integration[]>([
  {
    id: 1,
    name: "ERP",
    description:
      "Nutzen Sie die Daten aus Ihrem ERP System um Produktpässe zu erstellen.",
    isActive: true,
    icon: "database",
    lastSync: "vor 2 Minuten",
  },
  {
    id: 2,
    name: "Business Intelligence",
    description: "Erstellen Sie Auswertungen mit Ihrem BI System.",
    isActive: true,
    icon: "database",
    lastSync: "vor 5 Minuten",
  },
  {
    id: 3,
    name: "Excel Import / Export",
    description: "Importieren und Exportieren Sie Excel-Dateien.",
    isActive: false,
    icon: "folder",
  },
  {
    id: 4,
    name: "KI Assistent",
    description: "Lassen Sie sich von unserem KI-Assistenten helfen.",
    isActive: true,
    icon: "key",
  },
  {
    id: 5,
    name: "Email Alarme",
    description: "Lassen Sie sich bei Fehlern per Email benachrichtigen.",
    isActive: false,
    icon: "envelope",
  },
]);
</script>

<template>
  <UnderConstruction :show-preview="true">
    <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500">
            Anzahl Integrationen
          </div>
          <div class="mt-2 text-3xl font-semibold">
            {{ integrations.length }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500">
            Aktive
          </div>
          <div class="mt-2 text-3xl font-semibold text-green-600">
            {{ integrations.filter((i) => i.isActive).length }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500">
            Inaktive
          </div>
          <div class="mt-2 text-3xl font-semibold text-red-600">
            {{ integrations.filter((i) => !i.isActive).length }}
          </div>
        </div>
      </div>

      <!-- Integrations List -->
      <div class="bg-white rounded-lg shadow">
        <div class="grid gap-6 p-6">
          <div
            v-for="integration in integrations"
            :key="integration.id"
            class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <!-- Icon -->
            <div
              class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-gray-200 rounded-lg"
            >
              <!-- Dynamic icon based on type -->
              <svg
                v-if="integration.icon === 'code'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else-if="integration.icon === 'database'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              <svg
                v-else-if="integration.icon === 'folder'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <svg
                v-else-if="integration.icon === 'key'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <!-- Head outline -->
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
                />
                <!-- Eyes -->
                <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <!-- Circuit lines -->
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7v-2M16 7v-2M12 17v2"
                />
                <!-- Antenna -->
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5V3m-2 2l2-2 2 2"
                />
              </svg>
              <svg
                v-else-if="integration.icon === 'envelope'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <!-- Content -->
            <div class="ml-4 flex-1">
              <h3 class="text-lg font-medium text-gray-900">
                {{ integration.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ integration.description }}
              </p>
              <div v-if="integration.lastSync" class="mt-2 flex items-center">
                <span class="text-xs text-gray-500">Letzte Synchronisation: {{ integration.lastSync }}</span>
              </div>
            </div>

            <!-- Status -->
            <div class="ml-4 flex-shrink-0">
              <span
                v-if="integration.isActive"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                Aktiv
              </span>
              <span
                v-else
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
              >
                Inaktiv
              </span>
            </div>

            <!-- Action Button -->
            <button
              class="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </UnderConstruction>
</template>
