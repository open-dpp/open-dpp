<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import type { TemplateOption } from "../../composables/template-options.ts";

const { option } = defineProps<{
  option: TemplateOption;
}>();

const { t } = useI18n();

// The row only shows the beginning of long names, the popover on the info icon shows everything.
const popover = useTemplateRef<{ show: (event: Event) => void; hide: () => void }>("popover");
</script>

<template>
  <div class="flex w-full min-w-0 items-center gap-2" data-cy="template-select-option">
    <span class="max-w-3/4 truncate text-xl">{{ option.label }}</span>
    <i
      class="pi pi-info-circle text-muted-color"
      role="img"
      :aria-label="t('notifications.info')"
      data-cy="template-select-option-info"
      @mouseenter="popover?.show($event)"
      @mouseleave="popover?.hide()"
    />
    <Tag severity="secondary" :value="option.status" />
    <Popover ref="popover" data-cy="template-select-option-details">
      <dl class="m-0 grid max-w-96 grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt class="font-semibold">{{ t("common.name") }}</dt>
        <dd class="m-0 break-words">{{ option.label }}</dd>
        <dt class="font-semibold">{{ t("filter.status") }}</dt>
        <dd class="m-0">{{ option.status }}</dd>
        <dt class="font-semibold">{{ t("common.id") }}</dt>
        <dd class="m-0 break-all">{{ option.id }}</dd>
      </dl>
    </Popover>
  </div>
</template>
