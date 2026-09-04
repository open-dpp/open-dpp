<script lang="ts" setup>
import { onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import Passport from "../../components/presentation/Passport.vue";
import { useAnalyticsStore } from "../../stores/analytics.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import {
  PassportLoadError,
  PassportNotFoundError,
  usePassportStore,
} from "../../stores/passport.ts";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const passportStore = usePassportStore();
const analyticsStore = useAnalyticsStore();
const errorHandlingStore = useErrorHandlingStore();
const passportAvailable = ref(false);

async function pushNotFound(permalink: string) {
  await router.push({
    path: "404",
    query: {
      permalink,
    },
  });
}

watch(
  () => String(route.params.permalink ?? ""),
  async (permalink, _prev, onCleanup) => {
    let canceled = false;
    onCleanup(() => {
      canceled = true;
    });

    passportAvailable.value = false;
    try {
      await passportStore.loadPassport(permalink);
      if (canceled) return;
      passportAvailable.value = true;
      await analyticsStore.addPageView();
    } catch (error) {
      if (error instanceof PassportNotFoundError) {
        if (!canceled) {
          await pushNotFound(permalink);
        }
        return;
      }
      if (canceled) return;
      const messageKey =
        error instanceof PassportLoadError
          ? error.translationKey
          : "presentation.loadPassportError";
      errorHandlingStore.logErrorWithNotification(t(messageKey), error);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  passportStore.clearPermalink();
});
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <Passport v-if="passportAvailable" />
  </div>
</template>
