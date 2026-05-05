<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import CreateOrganizationForm from "../../components/organizations/CreateOrganizationForm.vue";
import ContentViewWrapper from "../ContentViewWrapper.vue";
import { useInstanceSettings } from "../../composables/instance.settings.ts";
import InvitationsTable from "./InvitationsTable.vue";
import { useRoute } from "vue-router";
import { onMounted, watch } from "vue";

const { t } = useI18n();
const { canCreateOrganization, fetchInstanceSettings } = useInstanceSettings();
const route = useRoute();
const hideInvitations = route.query.hideInvitations === "true";

onMounted(async () => {
  await fetchInstanceSettings();
});
</script>

<template>
  <ContentViewWrapper>
    <div class="flex flex-col gap-2">
      <Card>
        <template #content>
          <div v-if="canCreateOrganization" class="flex flex-col gap-2">
            <h1 class="text-xl font-bold text-gray-900">
              {{ t("organizations.create") }}
            </h1>
            <CreateOrganizationForm />
          </div>
          <div v-else class="flex flex-col gap-2">
            <h1 class="text-xl font-bold text-gray-900">
              {{ t("organizations.organizationCreationDisabled.title") }}
            </h1>
            <p class="text-pretty text-gray-500">
              {{ t("organizations.organizationCreationDisabled.description") }}
            </p>
          </div>
        </template>
      </Card>
      <Card v-if="!hideInvitations">
        <template #content><InvitationsTable /></template>
      </Card>
    </div>
  </ContentViewWrapper>
</template>
