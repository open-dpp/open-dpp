<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import { onMounted, ref } from "vue";
import OrganizationsAdminList from "../../components/organizations/OrganizationsAdminList.vue";
import axiosIns from "../../lib/axios.ts";

const organizations = ref<Organization[]>([]);

async function fetchOrganizations() {
  const res = await axiosIns.get("/auth/organizations");
  if (res.data) {
    organizations.value = res.data;
  }
}

onMounted(async () => {
  await fetchOrganizations();
});
</script>

<template>
  <section>
    <div class="flex flex-col gap-3 p-3">
      <OrganizationsAdminList v-if="organizations.length > 0" :organizations="organizations" />
    </div>
  </section>
</template>
