<script lang="ts" setup>
import type { PresentationMenuItem } from "../../composables/presentation-menu.ts";
import { useI18n } from "vue-i18n";
import { usePresentationMenu } from "../../composables/presentation-menu.ts";
import NavigationTree from "./NavigationTree.vue";

const visible = defineModel<boolean>({ required: true });

const { t } = useI18n();
const { menuItems } = usePresentationMenu();

function onNavigate() {
  visible.value = false;
}

function onMenuItemClick(item: PresentationMenuItem) {
  item.command();
  visible.value = false;
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="left"
    :header="t('presentation.navigation')"
  >
    <nav class="flex flex-col gap-6">
      <ul class="flex flex-col gap-1">
        <li v-for="item in menuItems" :key="item.label">
          <button
            class="flex items-center gap-3 w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            @click="onMenuItemClick(item)"
          >
            <i :class="item.icon" class="text-base" />
            {{ item.label }}
          </button>
        </li>
      </ul>
      <div class="border-t border-gray-100 pt-4">
        <h3 class="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 mb-2">
          {{ t("presentation.productpass") }}
        </h3>
        <NavigationTree @navigate="onNavigate" />
      </div>
    </nav>
  </Drawer>
</template>
