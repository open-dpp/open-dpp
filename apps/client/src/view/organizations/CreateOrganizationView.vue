<script lang="ts" setup>
import CreateOrganizationForm from "../../components/organizations/CreateOrganizationForm.vue";
</script>

<template>
  <div class="">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          Organisation
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Erstellen Sie eine neue Organisation.
        </p>
      </div>
    </div>
    <div class="mt-8 flow-root">
      <CreateOrganizationForm />
    </div>
  </div>
</template>
