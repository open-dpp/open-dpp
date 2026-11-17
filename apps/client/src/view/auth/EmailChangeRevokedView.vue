<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import BrandingLogo from "../../components/media/BrandingLogo.vue";

const { t } = useI18n();
const route = useRoute();

const status = computed(() => {
  if (route.query.status === "ok") return "ok";
  if (route.query.status === "error") return "error";
  return "invalid";
});
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <Card class="p-3 sm:mx-auto sm:w-full sm:max-w-md">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="py-2 text-center">
          {{
            status === "ok"
              ? t("auth.emailChangeRevoked.successTitle")
              : status === "error"
                ? t("auth.emailChangeRevoked.errorTitle")
                : t("auth.emailChangeRevoked.invalidTitle")
          }}
        </p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <Message
            v-if="status === 'ok'"
            data-testid="revoke-success"
            severity="success"
            :closable="false"
          >
            {{ t("auth.emailChangeRevoked.successBody") }}
          </Message>
          <Message
            v-else-if="status === 'error'"
            data-testid="revoke-error"
            severity="warn"
            :closable="false"
          >
            {{ t("auth.emailChangeRevoked.errorBody") }}
          </Message>
          <Message v-else data-testid="revoke-invalid" severity="error" :closable="false">
            {{ t("auth.emailChangeRevoked.invalidBody") }}
          </Message>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          <router-link
            to="/signin"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.emailChangeRevoked.ctaSignIn") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
