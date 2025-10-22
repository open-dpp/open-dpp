<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import CreateOrganizationForm from "../../components/organizations/CreateOrganizationForm.vue";

const { t } = useI18n();
</script>

<template>
  <div class="">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ t('organizations.organizations', 1) }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('organizations.create') }}
        </p>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <CreateOrganizationForm />
    </div>
  </div>
</template>
