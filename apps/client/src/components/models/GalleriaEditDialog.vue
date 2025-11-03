<script setup lang="ts">
import type { MediaInfo } from "../media/MediaInfo.interface.ts";
import { Button, Column, DataTable, Dialog, Image } from "primevue";

const visible = defineModel<boolean>("visible");
const images = defineModel<{ blob: Blob | null; mediaInfo: MediaInfo; url: string }[]>("images");
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Edit Profile"
    :style="{ width: '400px' }"
  >
    <DataTable :value="images" table-style="min-width: 50rem">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">Products</span>
          <Button icon="pi pi-refresh" rounded raised />
        </div>
      </template>
      <Column field="mediaInfo.title" header="Titel" />
      <Column header="Image">
        <template #body="slotProps">
          <Image :src="slotProps.data.url" preview />
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>
