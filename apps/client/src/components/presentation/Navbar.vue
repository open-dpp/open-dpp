<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBrandingAnonymous } from "../../composables/branding.ts";
import { usePresentationMenu } from "../../composables/presentation-menu.ts";
import BrandingLogo from "../media/BrandingLogo.vue";

const props = defineProps<{
  drawerVisible: boolean;
}>();

const emit = defineEmits<{
  toggleMenu: [];
}>();

const { t } = useI18n();
const { permalink, menuItems, navigateToAiChat } = usePresentationMenu();
const { src } = useBrandingAnonymous(permalink);
</script>

<template>
  <Menubar
    class="border-b! border-gray-100! bg-white/80! px-6! py-3! backdrop-blur-md!"
    :model="menuItems"
    :pt="{
      button: { class: 'hidden!' },
      rootList: { class: 'hidden! md:flex!' },
    }"
  >
    <template #start>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-bars"
          text
          rounded
          class="md:hidden!"
          :aria-label="t('presentation.navigation')"
          :aria-expanded="props.drawerVisible"
          @click="emit('toggleMenu')"
        />
        <BrandingLogo :url="src" />
      </div>
    </template>
    <template #end>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-comments"
          size="large"
          rounded
          :aria-label="t('presentation.chatWithAI')"
          @click="navigateToAiChat"
        />
      </div>
    </template>
  </Menubar>
</template>
