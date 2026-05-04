<script lang="ts" setup>
import { useRoute } from "vue-router";
import { buildLegacyPresentationApiUrl } from "../../lib/legacy-presentation-redirect";

const route = useRoute();
const search = typeof window !== "undefined" ? window.location.search : "";
const redirectUrl = buildLegacyPresentationApiUrl(route.params.legacyPath, search);

if (typeof window !== "undefined") {
  window.location.replace(redirectUrl);
}
</script>

<template>
  <div />
</template>
