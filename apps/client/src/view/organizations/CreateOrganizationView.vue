<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import CreateOrganizationForm from "../../components/organizations/CreateOrganizationForm.vue";
import ContentViewWrapper from "../ContentViewWrapper.vue";
import { useInvitations } from "../../composables/invitation.ts";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useInstanceSettings } from "../../composables/instance.settings.ts";
const { t } = useI18n();
const { canCreateOrganization } = useInstanceSettings();
const { invitations, fetchInvitations } = useInvitations();
onMounted(async () => {
  await fetchInvitations();
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
      <Card>
        <template #content>
          <DataTable :value="invitations" tableStyle="min-width: 50rem">
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-xl font-bold">{{
                  t("organizations.userInvitations.title")
                }}</span>
              </div>
            </template>
            <Column field="id" header="Id"></Column>
            <Column
              field="organization.name"
              :header="t('organizations.invitation.invitedToOrganization')"
            />
            <Column field="inviter.name" :header="t('organizations.invitation.invitedBy')" />
            <Column>
              <template #body="{ data }">
                <div class="flex w-full justify-end">
                  <div class="flex items-center gap-2 rounded-md">
                    <Button asChild v-slot="slotProps">
                      <RouterLink :to="`/accept-invitation/${data.id}`" :class="slotProps.class">{{
                        t("organizations.invitation.accept")
                      }}</RouterLink>
                    </Button>
                  </div>
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </ContentViewWrapper>
</template>
