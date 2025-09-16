<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ title }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex flex-row gap-3 mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          v-show="false"
          class="block rounded-full px-3 py-1.5 text-center text-sm/6 font-semibold text-black shadow-xs hover:bg-indigo-500 hover:text-white hover:cursor-pointer"
          type="button"
        >
          <MagnifyingGlassIcon class="h-5 w-5" />
        </button>
        <div
          v-if="searchable"
          class="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6"
        >
          <div
            class="flex items-center px-6 md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none xl:px-0"
          >
            <div class="grid w-full grid-cols-1">
              <input
                class="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 max-w-32 focus:max-w-none"
                name="search"
                placeholder="Search"
                type="search"
                @input="
                  (event) =>
                    emits(
                      'update-search',
                      (event.target as HTMLInputElement).value,
                    )
                "
              />
              <MagnifyingGlassIcon
                aria-hidden="true"
                class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
              />
            </div>
          </div>
        </div>
        <Dropdown
          v-if="sortable"
          :icon="FunnelIcon"
          :items="[{ text: 'Version' }]"
          title="Sortieren"
        />
        <Dropdown
          v-if="showOptions"
          :icon="EllipsisVerticalIcon"
          :items="[
            { text: 'Suchen', icon: MagnifyingGlassIcon },
            { text: 'Version' },
          ]"
          title="Sortieren"
        />
      </div>
    </div>
    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="relative">
            <div
              v-if="
                selection &&
                selection.multiple &&
                selected &&
                selected.length > 0 &&
                selection.multipleActions
              "
              class="absolute top-0 left-14 flex h-12 items-center space-x-3 bg-white sm:left-12"
            >
              <button
                class="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                type="button"
              >
                Alle bearbeiten
              </button>
              <button
                class="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                type="button"
              >
                Alle löschen
              </button>
            </div>
            <table class="min-w-full table-fixed divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    v-if="selection"
                    class="relative px-7 sm:w-12 sm:px-6"
                    scope="col"
                  >
                    <div
                      v-if="selection.multiple"
                      class="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1"
                    >
                      <input
                        :checked="selected?.length === items.length"
                        class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                        type="checkbox"
                        @click="toggleSelectAll"
                      />
                    </div>
                  </th>
                  <th
                    v-if="!hideIdColumn"
                    class="min-w-48 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900"
                    scope="col"
                  >
                    ID
                  </th>
                  <th
                    v-for="(header, index) in headers"
                    :key="index"
                    class="min-w-48 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900"
                    scope="col"
                  >
                    {{ header }}
                  </th>
                  <th class="relative py-3.5 pr-4 pl-3 sm:pr-3" scope="col">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="(item, itemIndex) in itemsOfPage"
                  :key="item.id"
                  :class="[
                    isSelected(item) && 'bg-gray-50',
                    selection && 'hover:bg-gray-50 hover:cursor-pointer',
                  ]"
                  @click="selection ? toggleSelectedItem(item) : () => {}"
                >
                  <td v-if="selection" class="px-7 sm:w-12 sm:px-6">
                    <input
                      :checked="isSelected(item)"
                      :data-cy="`list-item-checkbox-${item.id}`"
                      :value="isSelected(item)"
                      class="rounded-sm"
                      type="checkbox"
                      @input="toggleSelectedItem(item)"
                      @click.stop
                    />
                  </td>
                  <td
                    v-if="!hideIdColumn"
                    :class="[
                      'py-4 pr-3 text-sm font-medium whitespace-nowrap',
                      isSelected(item) ? 'text-indigo-600' : 'text-gray-900',
                    ]"
                  >
                    {{ item.id }}
                  </td>
                  <slot :item="item" name="row" />
                  <td
                    v-if="itemActions && itemActions.length > 0"
                    class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3"
                  >
                    <Dropdown
                      :icon="EllipsisVerticalIcon"
                      :items="
                        itemActions.map((action) => {
                          return { text: action.text, icon: action.icon };
                        })
                      "
                      :position="
                        pagination && rowsPerPage / 2 > itemIndex
                          ? 'below'
                          : 'above'
                      "
                      title="Aktionen"
                      @item-clicked="
                        (index) => emits('item-action', item.id, index)
                      "
                    />
                  </td>
                </tr>
                <tr v-if="filteredItems.length === 0">
                  <td
                    :colspan="headers.length + (selection ? 1 : 0)"
                    class="py-4 text-center w-full h-full"
                  >
                    Keine Elemente gefunden
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div v-if="pagination">
      <Pagination
        :current-page="page"
        :items-per-page="rowsPerPage"
        :total-items="filteredItems.length"
        @page-changed="(newPage) => (page = newPage)"
      />
    </div>
  </div>
</template>

<script generic="T extends AdvancedListItem" lang="ts" setup>
import { computed, type FunctionalComponent, ref } from "vue";
import { AdvancedListItem } from "./AdvancedListItem.interface";
import {
  EllipsisVerticalIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/16/solid";
import Dropdown from "../Dropdown.vue";
import Pagination from "./Pagination.vue";

const defaults = {
  rowsPerPage: 5,
};

const props = defineProps<{
  headers: string[];
  items: Array<T>;
  itemActions?: Array<{
    text: string;
    icon?: FunctionalComponent;
  }>;
  pagination?:
    | boolean
    | {
        rowsPerPage?: number;
      };
  selection?: {
    multiple?: boolean;
    multipleActions?: boolean;
  };
  searchable?: boolean;
  search?: string;
  sortable?: boolean;
  selected?: Array<T>;
  title?: string;
  subtitle?: string;
  showOptions?: boolean;
  hideIdColumn?: boolean;
}>();

const emits = defineEmits<{
  (e: "update-selected-items", item: T[]): void;
  (e: "update-search", value: string): void;
  (e: "item-action", itemId: string, actionIndex: number): void;
}>();

const page = ref<number>(0);

const headers = computed(() =>
  props.itemActions && props.itemActions.length > 0
    ? [...props.headers, "Aktionen"]
    : props.headers,
);

const rowsPerPage = computed(() => {
  if (typeof props.pagination === "boolean") {
    return defaults.rowsPerPage;
  }
  return props.pagination?.rowsPerPage ?? defaults.rowsPerPage;
});

const selectedItems = computed(() => {
  return props.selected ?? [];
});

const filteredItems = computed(() => {
  if (props.search === undefined) {
    return props.items;
  }
  return props.items.filter((item) =>
    Object.values(item).some((value) =>
      String(value)
        .toLowerCase()
        .includes((props.search ?? "").toLowerCase()),
    ),
  );
});

const itemsOfPage = computed(() => {
  if (props.pagination) {
    return filteredItems.value.slice(
      page.value * rowsPerPage.value,
      (page.value + 1) * rowsPerPage.value,
    );
  }
  return filteredItems.value;
});

const isSelected = (item: T) => {
  return selectedItems.value.some(
    (selectedItem) => selectedItem.id === item.id,
  );
};

const toggleSelectedItem = (item: T) => {
  if (props.selection?.multiple) {
    const selected = [...(props.selected ?? [])];
    if (isSelected(item)) {
      const index = selected.findIndex(
        (selectedItem) => selectedItem.id === item.id,
      );
      selected.splice(index, 1);
    } else {
      selected.push(item);
    }
    emits("update-selected-items", selected);
  } else {
    if (isSelected(item)) {
      emits("update-selected-items", []);
    } else {
      emits("update-selected-items", [item]);
    }
  }
};

const toggleSelectAll = () => {
  if (!props.selection?.multiple) {
    return;
  }
  if (selectedItems.value.length === 0) {
    emits("update-selected-items", props.items);
  } else {
    emits("update-selected-items", []);
  }
};
</script>
