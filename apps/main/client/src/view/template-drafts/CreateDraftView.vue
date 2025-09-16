<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          Passvorlagen Entwurf
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Entwerfen Sie eine neue Passvorlage.
        </p>
      </div>
    </div>
    <div>
      <CreateDraftForm @submit="onSubmit" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import CreateDraftForm from "../../components/template-drafts/CreateDraftForm.vue";
import { useRoute, useRouter } from "vue-router";
import { useDraftStore } from "../../stores/draft";
import { TemplateDraftCreateDto } from "@open-dpp/api-client";

const router = useRouter();
const route = useRoute();

const draftStore = useDraftStore();

const onSubmit = async (draftData: TemplateDraftCreateDto) => {
  await draftStore.createDraft(draftData);

  await router.push(
    `/organizations/${route.params.organizationId}/data-model-drafts/${draftStore.draft?.id}`,
  );
};
</script>
