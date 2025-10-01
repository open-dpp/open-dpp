<template>
  <section></section>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import keycloakIns from '../lib/keycloak';
import { useIndexStore } from '../stores';

const indexStore = useIndexStore();

onMounted(async () => {
  await keycloakIns.logout({ redirectUri: window.location.origin });
  indexStore.selectOrganization(null);
});
</script>
