<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBranding } from "../../composables/branding";
import { useRoute, useRouter } from "vue-router";
import { useIndexStore } from "../../stores";
import {
  CubeIcon,
  Square3Stack3DIcon,
  UsersIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import { ChartBarIcon, CloudIcon, LinkIcon } from "@heroicons/vue/16/solid";
import { computed, onMounted, type FunctionalComponent } from "vue";
import { authClient } from "../../auth-client";
import { useStatusStore } from "../../stores/status";
import { useLayoutStore } from "../../stores/layout";

const { src } = useBranding();
const route = useRoute();
const router = useRouter();

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

const layoutStore = useLayoutStore();

const statusStore = useStatusStore();
onMounted(() => statusStore.fetchStatus());
const indexStore = useIndexStore();
const navigation = computed<Array<MenuItemGroupInterface>>(() => {
  const navigationGroups: Array<MenuItemGroupInterface> = [
    {
      name: "",
      items: [
        {
          name: `${t("passports.label", 2)}`,
          to: `/organizations/${indexStore.selectedOrganization}/passports`,
          icon: CubeIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: `${t("templates.label", 2)}`,
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
      name: t("organizations.organizations"),
      items: [
        {
          name: t("members.members"),
          to: `/organizations/${indexStore.selectedOrganization}/members`,
          icon: UsersIcon,
          show: () => indexStore.selectedOrganization !== null,
        },
        {
          name: t("organizations.settings.title"),
          to: `/organizations/${indexStore.selectedOrganization}`,
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
    navigationGroups.push({
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
        {
          name: t("organizations.admin.settings"),
          to: "/admin/settings",
          icon: Cog6ToothIcon,
          show: () => role.value === "admin",
        },
      ],
    });
  }
  return navigationGroups
    .map((group) => {
      return {
        ...group,
        items: group.items.filter((item) => item.show()),
      };
    })
    .filter((group) => group.items.length > 0);
});

const { t } = useI18n();
</script>

<template>
  <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
    <div class="flex shrink-0 items-start p-2">
      <BrandingLogo :center="false" :url="src" @click="router.push('/')" />
    </div>
    <nav class="flex flex-1 flex-col">
      <ul class="flex flex-1 flex-col gap-y-7" role="list">
        <li v-for="group in navigation" :key="group.name">
          <div class="text-xs leading-6 font-semibold text-gray-400">
            {{ group.name }}
          </div>
          <ul class="-mx-2 space-y-1" role="list">
            <li v-for="item in group.items" :key="item.name">
              <router-link
                class="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                :class="[
                  item.to === route.path
                    ? 'bg-gray-50 text-black'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-black',
                ]"
                :to="item.to"
              >
                <component
                  :is="item.icon"
                  class="h-6 w-6 shrink-0"
                  :class="[
                    item.to === route.path ? 'text-black' : 'text-gray-400 group-hover:text-black',
                  ]"
                  aria-hidden="true"
                />
                {{ item.name }}
              </router-link>
            </li>
          </ul>
        </li>
        <li class="mt-auto">
          <SelectOrganization />
          <p v-if="statusStore.version" class="mt-2 text-center text-xs text-gray-500">
            v{{ statusStore.version }}
          </p>
        </li>
      </ul>
    </nav>
  </div>
</template>
