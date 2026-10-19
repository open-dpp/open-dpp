<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

export interface ActivityHistoryBreadcrumbItem {
  value: number;
  label: string;
}

const props = defineProps<{ items: ActivityHistoryBreadcrumbItem[] }>();
const emit = defineEmits<{ navigate: [value: number] }>();
const { t } = useI18n();

const popover = useTemplateRef("popover");
const openItem = ref<ActivityHistoryBreadcrumbItem | null>(null);

function onDotClick(event: Event, item: ActivityHistoryBreadcrumbItem) {
  openItem.value = item;
  popover.value?.toggle(event);
}

function onNavigate() {
  if (openItem.value) {
    emit("navigate", openItem.value.value);
  }
  popover.value?.hide();
}
</script>

<template>
  <nav class="flex min-w-0 items-center gap-1" aria-label="Activity history navigation">
    <template v-for="(item, index) in props.items" :key="item.value">
      <i
        v-if="index > 0"
        class="pi pi-angle-right shrink-0 text-xs text-gray-400"
        aria-hidden="true"
      />
      <span
        v-if="index === props.items.length - 1"
        class="min-w-0 flex-1 truncate text-sm font-medium text-gray-900"
      >
        {{ item.label }}
      </span>
      <button
        v-else
        v-tooltip.top="item.label"
        type="button"
        class="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-400 transition-colors hover:bg-gray-600"
        :aria-label="item.label"
        @click="onDotClick($event, item)"
      />
    </template>
    <Popover ref="popover">
      <div class="flex max-w-xs flex-col gap-2">
        <span class="text-sm wrap-anywhere">{{ openItem?.label }}</span>
        <Button size="small" :label="t('common.select')" @click="onNavigate" />
      </div>
    </Popover>
  </nav>
</template>
