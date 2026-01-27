<script lang="ts" setup>
import type { FunctionalComponent } from "vue";
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import {
  ChartBarIcon,
  CloudIcon,
  LinkIcon,
  Squares2X2Icon,
} from "@heroicons/vue/16/solid";
import {
  Bars3Icon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  CubeIcon,
  Square3Stack3DIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import logo from "../../assets/logo-with-text.svg";
import { authClient } from "../../auth-client.ts";
import { useIndexStore } from "../../stores";
import { useLayoutStore } from "../../stores/layout";
import Breadcrumbs from "../Breadcrumbs.vue";
import NotificationHandler from "../notifications/NotificationHandler.vue";
import SelectOrganization from "../organizations/SelectOrganization.vue";
import RingLoader from "../RingLoader.vue";

const route = useRoute();
const router = useRouter();

const indexStore = useIndexStore();
const layoutStore = useLayoutStore();

const { t } = useI18n();

interface MenuItemInterface {
  name: string;
  to: string;
  icon: FunctionalComponent;
  show: () => boolean;
}

interface MenuItemGroupInterface {
  name: string;
  items: Array<MenuItemInterface>;
}

const role = computed<string>(() => {
  const session = authClient.useSession();
  if (!session.value.data) {
    return "user";
  }
  const userSession = session.value.data;
  return userSession.user.role ?? "user";
});

const navigation = computed<Array<MenuItemGroupInterface>>(() => {
  const navigationGroups: Array<MenuItemGroupInterface> = [
    {
      name: "",
      items: [
        {
          name: t("models.models"),
          to: `/organizations/${indexStore.selectedOrganization}/models`,
          icon: CubeIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("draft.passportDraft", 2),
          to: `/organizations/${indexStore.selectedOrganization}/data-model-drafts`,
          icon: Square3Stack3DIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: `${t("templates.label", 2)} AAS @beta`,
          to: `/organizations/${indexStore.selectedOrganization}/templates`,
          icon: Square3Stack3DIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("integrations.integrations"),
          to: `/organizations/${indexStore.selectedOrganization}/integrations`,
          icon: LinkIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("analytics.analytics"),
          to: `/organizations/${indexStore.selectedOrganization}/analytics`,
          icon: ChartBarIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
      ],
    },
    {
      name: "Organization",
      items: [

        {
          name: t("members.members"),
          to: `/organizations/${indexStore.selectedOrganization}/members`,
          icon: UsersIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("organizations.settings.title"),
          to: `/organizations/${indexStore.selectedOrganization}/settings`,
          icon: Cog6ToothIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("organizations.pick"),
          to: "/organizations",
          icon: BuildingOfficeIcon,
          show: () => indexStore.selectedOrganization === null,
        },
      ],
    },
    {
      name: t("marketplace.marketplace"),
      items: [
        {
          name: t("marketplace.marketplace"),
          to: "/marketplace",
          icon: Squares2X2Icon,
          show: () => indexStore.selectedOrganization !== null,
        },
      ],
    },
    {
      name: t("media.media"),
      items: [
        {
          name: t("media.media"),
          to: "/media",
          icon: CloudIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
      ],
    },
  ];
  if (role.value === "admin") {
    navigationGroups.push(
      {
        name: t("organizations.admin.title"),
        items: [
          {
            name: t("organizations.admin.organizations"),
            to: "/admin/organizations",
            icon: BuildingOfficeIcon,
            show: () => role.value === "admin",
          },
          {
            name: t("organizations.admin.users"),
            to: "/admin/users",
            icon: UserGroupIcon,
            show: () => role.value === "admin",
          },
        ],
      },
    );
  }
  return navigationGroups
    .map((group) => {
      return {
        ...group,
        items: group.items.filter(item => item.show()),
      };
    })
    .filter(group => group.items.length > 0);
});

const userNavigation = [
  { name: t("user.profile"), to: "/profile" },
  { name: t("user.logout"), to: "/logout" },
];

const initials = computed(() => {
  const session = authClient.useSession();
  if (!session.value.data)
    return "AN";
  const userSession = session.value.data;
  const first = userSession.user.firstName?.substring(0, 1) || "A";
  const last = userSession.user.lastName?.substring(0, 1) || "N";
  return (first + last).toUpperCase();
});

const fullName = computed(() => {
  const session = authClient.useSession();
  if (!session.value.data)
    return "AN";
  const userSession = session.value.data;
  const first = userSession.user.firstName;
  const last = userSession.user.lastName;
  return `${first} ${last}`;
});

const sidebarOpen = ref(false);
</script>

<template>
  <NotificationHandler />
  <div>
    <TransitionRoot :show="sidebarOpen" as="oldTemplate">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="oldTemplate"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="oldTemplate"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as="oldTemplate"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div
                  class="absolute left-full top-0 flex w-16 justify-center pt-5"
                >
                  <button
                    class="-m-2.5 p-2.5"
                    data-cy="closeSidebar"
                    type="button"
                    @click="sidebarOpen = false"
                  >
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" class="h-6 w-6 text-white" />
                  </button>
                </div>
              </TransitionChild>
              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div
                class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4"
                data-cy="sidebar"
              >
                <div class="flex h-16 shrink-0 items-center">
                  <img :src="logo" alt="open-dpp GmbH" class="h-8 w-auto">
                </div>
                <nav class="flex flex-1 flex-col">
                  <ul class="flex flex-1 flex-col gap-y-7" role="list">
                    <li v-for="group in navigation" :key="group.name">
                      <div
                        class="text-xs font-semibold leading-6 text-gray-400"
                      >
                        {{ group.name }}
                      </div>
                      <ul class="-mx-2 space-y-1" role="list">
                        <li v-for="item in group.items" :key="item.name">
                          <router-link
                            class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6" :class="[
                              item.to === route.path
                                ? 'bg-gray-50 text-gray-700'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-black',
                            ]"
                            :to="item.to"
                          >
                            <component
                              :is="item.icon"
                              class="h-6 w-6 shrink-0" :class="[
                                item.to === route.path
                                  ? 'text-black'
                                  : 'text-gray-400 group-hover:text-black',
                              ]"
                              aria-hidden="true"
                            />
                            {{ item.name }}
                          </router-link>
                        </li>
                      </ul>
                    </li>
                    <li v-if="layoutStore.quickAccessItems.length > 0">
                      <div
                        class="text-xs font-semibold leading-6 text-gray-400"
                      >
                        Schnellzugriff
                      </div>
                      <ul class="-mx-2 mt-2 space-y-1" role="list">
                        <li
                          v-for="item in layoutStore.quickAccessItems"
                          :key="item.name"
                        >
                          <router-link
                            class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6" :class="[
                              item.path === route.path
                                ? 'bg-gray-50 text-black'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-black',
                            ]"
                            :to="item.path"
                          >
                            <span
                              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium" :class="[
                                item.path === route.path
                                  ? 'border-black text-black'
                                  : 'border-gray-200 text-gray-400 group-hover:border-black group-hover:text-black',
                              ]"
                            >{{
                              item.name
                            }}</span>
                            <span class="truncate">{{ item.name }}</span>
                          </router-link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    >
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div
        class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4"
      >
        <div class="flex h-16 shrink-0 items-center">
          <img
            :src="logo"
            alt="open-dpp GmbH"
            class="h-8 w-auto hover:cursor-pointer"
            @click="router.push('/')"
          >
        </div>
        <nav class="flex flex-1 flex-col">
          <ul class="flex flex-1 flex-col gap-y-7" role="list">
            <li v-for="group in navigation" :key="group.name">
              <div
                class="text-xs font-semibold leading-6 text-gray-400"
              >
                {{ group.name }}
              </div>
              <ul class="-mx-2 space-y-1" role="list">
                <li v-for="item in group.items" :key="item.name">
                  <router-link
                    class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6" :class="[
                      item.to === route.path
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-black',
                    ]"
                    :to="item.to"
                  >
                    <component
                      :is="item.icon"
                      class="h-6 w-6 shrink-0" :class="[
                        item.to === route.path
                          ? 'text-black'
                          : 'text-gray-400 group-hover:text-black',
                      ]"
                      aria-hidden="true"
                    />
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
            <li v-if="layoutStore.quickAccessItems.length > 0">
              <div class="text-xs font-semibold leading-6 text-gray-400">
                Schnellzugriff
              </div>
              <ul class="-mx-2 mt-2 space-y-1" role="list">
                <li
                  v-for="item in layoutStore.quickAccessItems"
                  :key="item.name"
                >
                  <router-link
                    class="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6" :class="[
                      item.path === route.path
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-black',
                    ]"
                    :to="item.path"
                  >
                    <span
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium" :class="[
                        item.path === route.path
                          ? 'border-black text-black'
                          : 'border-gray-200 text-gray-400 group-hover:border-black group-hover:text-black',
                      ]"
                    >{{ item.name }}</span>
                    <span class="truncate">{{ item.name }}</span>
                  </router-link>
                </li>
              </ul>
            </li>
            <li class="mt-auto">
              <SelectOrganization />
            </li>
          </ul>
        </nav>
      </div>
    </div>

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

        <div class="flex w-full md:justify-between gap-x-2 justify-end">
          <Breadcrumbs class="hidden md:flex" />
          <div class="flex items-center gap-x-2">
            <span
              aria-hidden="true"
              class="hidden xl:inline-block ml-4 text-sm font-semibold leading-6 text-gray-900"
            >{{ fullName ?? "AN" }}</span>
            <!-- Profile dropdown -->
            <Menu as="div" class="relative">
              <MenuButton class="-m-1.5 flex items-center p-1.5">
                <div
                  class="hover:bg-indigo-700 cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-medium"
                >
                  {{ initials }}
                </div>
              </MenuButton>
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-hidden"
                >
                  <MenuItem
                    v-for="item in userNavigation"
                    :key="item.name"
                    v-slot="{ active }"
                  >
                    <router-link
                      class="block px-3 py-1 text-sm leading-6 text-gray-900" :class="[
                        active ? 'bg-gray-50' : '',
                      ]"
                      :to="item.to"
                    >
                      {{ item.name }}
                    </router-link>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>

      <main class="h-[calc(100vh-64px)]">
        <div class="h-[calc(100%)] px-4 sm:px-6 lg:px-8">
          <router-view v-slot="{ Component }">
            <transition :duration="75" appear mode="out-in" name="fade">
              <div
                v-if="layoutStore.isPageLoading"
                class="w-full min-h-full flex items-center justify-items-center"
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
