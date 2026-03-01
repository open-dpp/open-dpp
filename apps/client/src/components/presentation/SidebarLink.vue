<script lang="ts" setup>
import { computed } from "vue";
import { useDisplayName } from "../../composables/display-name";
import type { SubmodelTreeElement } from "../../composables/submodel-tree";

const { treeElement, parentId } = defineProps<{
  treeElement: SubmodelTreeElement;
  level: number;
  parentId: string;
}>();

const linkTarget = computed(() => {
    if (parentId === '') {
      return {
        hash: `#${treeElement.idShort}` 
      }
    }
    return {
      query: {
        submodelid: parentId
      },
      hash: `#${treeElement.idShort}` 
    }
})

const { description: name } = useDisplayName(treeElement.name);

const levelToPadding = [
    "pl-0",
    "pl-2",
    "pl-4",
    "pl-6",
    "pl-8",
    "pl-10"
]
</script>

<template>
  <li :class="[levelToPadding[level]]">
    <router-link
      :to="linkTarget"
      class="text-gray-700 hover:bg-gray-50 hover:text-indigo-600 group flex gap-x-3 rounded-md p-2 pl-3 text-sm/6 font-semibold"
    >
      {{ name }}
    </router-link>
    <ul v-if="treeElement.children && treeElement.children.length > 0">
      <SidebarLink
        v-for="child in treeElement.children"
        :tree-element="child"
        :parent-id="treeElement.idShort"
        :level="level + 1"
      ></SidebarLink>
    </ul>
  </li>
</template>
