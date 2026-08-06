<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import BrandingLogo from "../../components/media/BrandingLogo.vue";

const { t } = useI18n();
const route = useRoute();

const status = computed(() => {
  const error = route.query.error;
  if (typeof error !== "string" || error.length === 0) return "success";
  if (error === "TOKEN_EXPIRED") return "expired";
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
            status === "success"
              ? t("auth.emailVerified.successTitle")
              : status === "expired"
                ? t("auth.emailVerified.expiredTitle")
                : t("auth.emailVerified.invalidTitle")
          }}
        </p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <Message
            v-if="status === 'success'"
            data-testid="verify-success"
            severity="success"
            :closable="false"
          >
            {{ t("auth.emailVerified.successBody") }}
          </Message>
          <Message
            v-else-if="status === 'expired'"
            data-testid="verify-expired"
            severity="warn"
            :closable="false"
          >
            {{ t("auth.emailVerified.expiredBody") }}
          </Message>
          <Message v-else data-testid="verify-invalid" severity="error" :closable="false">
            {{ t("auth.emailVerified.invalidBody") }}
          </Message>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-center">
          <Button asChild v-slot="slotProps">
            <RouterLink to="/signin" data-testid="verify-signin-link" :class="slotProps.class">{{
              t("auth.emailVerified.ctaSignIn")
            }}</RouterLink>
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
