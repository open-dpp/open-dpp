<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { DigitalProductDocumentStatusDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import type { MenuItem } from "primevue/menuitem";

const props = defineProps<{
  item: DigitalProductDocumentDto;
}>();

const emits = defineEmits<{
  (e: "onDeleteClicked", item: DigitalProductDocumentDto): void;
  (e: "onPublishClicked", item: DigitalProductDocumentDto): void;
  (e: "onArchiveClicked", item: DigitalProductDocumentDto): void;
  (e: "onRestoreClicked", item: DigitalProductDocumentDto): void;
}>();
const menu = ref();
const { t } = useI18n();

const items = computed<MenuItem[]>(() => {
  const currentStatus = props.item.lastStatusChange.currentStatus;

  const restoreMenuItem = {
    label: t("status.restore"),
    icon: "pi pi-undo",
    command: () => emits("onRestoreClicked", props.item),
  };

  const archiveMenuItem = {
    label: t("status.archive"),
    icon: "pi pi-folder-open",
    command: () => emits("onArchiveClicked", props.item),
  };

  if (currentStatus === DigitalProductDocumentStatusDto.Published) {
    return [archiveMenuItem];
  } else if (currentStatus === DigitalProductDocumentStatusDto.Archived) {
    return [restoreMenuItem];
  } else {
    return [
      {
        label: t("status.publish"),
        icon: "pi pi-megaphone",
        command: () => emits("onPublishClicked", props.item),
      },
      archiveMenuItem,
      {
        label: t("common.remove"),
        icon: "pi pi-trash",
        command: () => emits("onDeleteClicked", props.item),
      },
    ];
  }
});
const toggle = (event: PointerEvent) => {
  menu.value.toggle(event);
};
</script>

<template>
  <div class="card flex justify-center">
    <Button
      severity="secondary"
      type="button"
      icon="pi pi-ellipsis-v"
      @click="toggle"
      aria-haspopup="true"
      aria-controls="overlay_menu"
    />
    <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
  </div>
</template>
