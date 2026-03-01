<script lang="ts" setup>
import { Button } from "primevue";
import { onMounted, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import DppTable from "../../components/DppTable.vue";
import PassportCreateDialog from "../../components/passport/PassportCreateDialog.vue";
import { usePagination } from "../../composables/pagination";
import { usePassports } from "../../composables/passports";

const route = useRoute();
const router = useRouter();

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const {
  passports,
  loading,
  fetchPassports,
} = usePassports();

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback: fetchPassports,
  changeQueryParams,
});

const { t } = useI18n();
const createDialog = useTemplateRef("createDialog");

function newPassport() {
  createDialog.value?.open();
}

async function routeToQrCode(id: string) {
  await router.push(`${route.path}/${id}/qr-code`);
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <DppTable
    key="templates-list"
    :has-previous="hasPrevious"
    :has-next="hasNext"
    :current-page="currentPage"
    :items="passports ? passports.result : []"
    :loading="loading"
    :title="t('passports.label', 2)"
    @reset-cursor="resetCursor"
    @create="newPassport"
    @next-page="nextPage"
    @previous-page="previousPage"
  >
    <template #actions="{ passport, editItem }">
      <Button
        icon="pi pi-qrcode"
        severity="info"
        @click="routeToQrCode(passport.id)"
      />
      <Button
        icon="pi pi-pencil"
        severity="primary"
        @click="editItem(passport.id)"
      />
    </template>
  </DppTable>
  <PassportCreateDialog ref="createDialog" />
</template>
