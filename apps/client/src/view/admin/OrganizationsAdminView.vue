<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import { isAxiosError } from "axios";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import OrganizationsAdminList from "../../components/organizations/OrganizationsAdminList.vue";
import axiosIns from "../../lib/axios.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";

const organizations = ref<Organization[]>([]);
const router = useRouter();
const errorHandlingStore = useErrorHandlingStore();

async function fetchOrganizations() {
  try {
    const res = await axiosIns.get("/auth/organizations");
    if (res.data) {
      organizations.value = res.data;
    }
  }
  catch (error) {
    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      await router.push({ name: "Signin" });
    }
    else {
      errorHandlingStore.logErrorWithNotification("Failed to fetch organizations", error);
    }
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
