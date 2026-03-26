<script lang="ts" setup>
import type { SubmodelTreeElement } from "../../composables/submodel-tree";
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";

const { treeElement, parentId, level } = defineProps<{
  treeElement: SubmodelTreeElement;
  level: number;
  parentId?: string;
}>();

const linkTarget = computed(() => {
  if (!parentId || parentId === "") {
    return {
      hash: `#${treeElement.idShort}`,
    };
  }
  return {
    query: {
      submodelid: parentId,
    },
    hash: `#${treeElement.idShort}`,
  };
});

const { description: name } = useDisplayName(treeElement.name);

const levelToPadding = ["pl-0", "pl-2", "pl-4", "pl-6", "pl-8", "pl-10"];

const paddingClass = computed(() => levelToPadding[Math.min(level, levelToPadding.length - 1)]);
</script>

<template>
  <li :class="[paddingClass]">
    <router-link
      :to="linkTarget"
      class="group flex gap-x-3 rounded-md p-2 pl-3 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
    >
      {{ name }}
    </router-link>
    <ul v-if="treeElement.children && treeElement.children.length > 0">
      <SidebarLink
        v-for="child in treeElement.children"
        :key="`sidebar-${child.idShort}`"
        :tree-element="child"
        :parent-id="treeElement.idShort"
        :level="level + 1"
      />
    </ul>
  </li>
</template>
