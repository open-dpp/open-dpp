<script lang="ts" setup>
import { useRoute } from "vue-router";
import { buildLegacyPresentationApiUrl } from "../../lib/legacy-presentation-redirect";

// Legacy URL shim: before v0.4.0 QR codes and bookmarks were generated as
// /presentation/<upiUuid>. On this branch those routes moved to /p/<permalinkId>
// where permalink IDs are independent of the old UPI UUIDs. Deep-linking to the
// old URL would otherwise 404 in the SPA, so we bounce the browser through the
// backend /api/unique-product-identifiers endpoint, which already knows how to
// resolve UPI → Permalink and 301-redirect to the new URL.
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
