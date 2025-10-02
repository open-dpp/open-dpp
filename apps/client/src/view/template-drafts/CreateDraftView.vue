<script lang="ts" setup>
import type { TemplateDraftCreateDto } from "@open-dpp/api-client";
import { useRoute, useRouter } from "vue-router";
import CreateDraftForm from "../../components/template-drafts/CreateDraftForm.vue";
import { useDraftStore } from "../../stores/draft";

const router = useRouter();
const route = useRoute();

const draftStore = useDraftStore();

async function onSubmit(draftData: TemplateDraftCreateDto) {
  await draftStore.createDraft(draftData);

  await router.push(
    `/organizations/${route.params.organizationId as string}/data-model-drafts/${draftStore.draft?.id}`,
  );
}
</script>

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
