<script lang="ts" setup>
import { computed } from "vue";
import { useNotificationStore } from "../../stores/notification";

const props = defineProps<{
  headers: string[];
  rows: Record<string, string>[];
  ignoreRowKeys?: string[];
  rowActions: {
    name: string;
    actionLinkBuilder: (row: Record<string, string>) => string;
  }[];
}>();

const notificationStore = useNotificationStore();

const headers = computed(() =>
  props.rowActions.length > 0 ? [...props.headers, "Aktionen"] : props.headers,
);

const rowKeys = computed(() => {
  return props.rows.length > 0
    ? Object.keys((props.rows[0] as Record<string, string>)).filter(
        key => !props.ignoreRowKeys?.includes(key),
      )
    : [];
});

function copyIdentifierToClipboard(key: string, text: string) {
  if (key === "uuid" || key === "id") {
    navigator.clipboard.writeText(text);
    notificationStore.addSuccessNotification(
      "In die Zwischenablage kopiert.",
      undefined,
      1000,
    );
  }
}
</script>

<template>
  <table class="min-w-full table-fixed divide-y divide-gray-300">
    <thead>
      <tr>
        <th
          v-for="(header, index) in headers"
          :key="index"
          class="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900"
          scope="col"
        >
          {{ header }}
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white">
      <tr
        v-for="(row, rowIndex) in rows"
        :key="rowIndex"
        :data-cy="`row-${rowIndex}`"
      >
        <td
          v-for="(key, colIndex) in rowKeys"
          :key="colIndex"
          :class="{
            'hover:cursor-pointer hover:text-indigo-600':
              key === 'uuid' || key === 'id',
          }"
          class="whitespace-nowrap py-4 text-sm text-gray-500"
          @click="copyIdentifierToClipboard(key, row[key] as string)"
        >
          {{ row[key] }}
        </td>
        <td
          class="whitespace-nowrap py-4 pr-4 text-right text-sm font-medium sm:pr-3 gap-4 flex flex-row"
        >
          <router-link
            v-for="(action, index) in rowActions"
            :key="index"
            :to="action.actionLinkBuilder(row)"
            class="text-indigo-600 hover:text-indigo-900"
          >
            {{ action.name }}
          </router-link>
        </td>
      </tr>
    </tbody>
  </table>
</template>
