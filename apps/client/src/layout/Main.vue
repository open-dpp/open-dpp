<script lang="ts" setup>
import { Bars3Icon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
import { useLayoutStore } from "../stores/layout";
import Breadcrumbs from "../components/navigation/Breadcrumbs.vue";
import NotificationHandler from "../components/notifications/NotificationHandler.vue";
import RingLoader from "../components/navigation/RingLoader.vue";
import SidebarContent from "../components/navigation/SidebarContent.vue";
import ProfileDropdown from "../components/profile/ProfileDropdown.vue";

const layoutStore = useLayoutStore();
const sidebarOpen = ref(false);
</script>

<template>
  <NotificationHandler />
  <div>
    <Drawer v-model:visible="sidebarOpen">
      <template #container>
        <SidebarContent></SidebarContent>
      </template>
    </Drawer>

    <SidebarContent
      class="hidden border-r border-gray-200 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    />

    <div class="lg:pl-72">
      <div
        class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8"
      >
        <button
          class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          data-cy="openSidebar"
          type="button"
          @click="sidebarOpen = true"
        >
          <span class="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" class="h-6 w-6" />
        </button>

        <!-- Separator -->
        <div aria-hidden="true" class="h-6 w-px bg-gray-200 lg:hidden" />

        <div class="flex w-full justify-end gap-x-2 md:justify-between">
          <Breadcrumbs class="hidden md:flex" />
          <div class="flex items-center gap-x-2">
            <Username />
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <main class="h-[calc(100vh-64px)]">
        <div class="h-[calc(100%)] px-4 sm:px-6 lg:px-8">
          <router-view v-slot="{ Component }">
            <transition :duration="75" appear mode="out-in" name="fade">
              <div
                v-if="layoutStore.isPageLoading"
                class="flex min-h-full w-full items-center justify-items-center"
              >
                <RingLoader class="mx-auto" />
              </div>
              <div v-else>
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>
