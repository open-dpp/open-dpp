<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import apiClient from "../../lib/api-client.ts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const token = computed(() => {
  const value = route.query.token;
  return typeof value === "string" ? value : null;
});

const loading = ref(true);
const submitting = ref(false);
const newEmail = ref<string | null>(null);

function goToResult(status: "ok" | "invalid" | "error") {
  void router.replace({ path: "/account/email-change-revoked", query: { status } });
}

onMounted(async () => {
  const currentToken = token.value;
  if (!currentToken) {
    goToResult("invalid");
    return;
  }

  try {
    const { data } = await apiClient.dpp.users.getEmailChangeRevokeInfo(currentToken);
    if (!data.valid) {
      goToResult("invalid");
      return;
    }
    newEmail.value = data.newEmail ?? null;
    loading.value = false;
  } catch {
    goToResult("error");
  }
});

async function revoke() {
  const currentToken = token.value;
  if (!currentToken || submitting.value) {
    return;
  }
  submitting.value = true;
  try {
    const { data } = await apiClient.dpp.users.revokeEmailChange(currentToken);
    goToResult(data.status);
  } catch {
    goToResult("error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <Card class="p-3 sm:mx-auto sm:w-full sm:max-w-md">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="py-2 text-center">{{ t("auth.emailChangeRevokeConfirm.title") }}</p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <p v-if="loading" data-testid="revoke-confirm-loading" class="text-center text-sm">
            {{ t("auth.emailChangeRevokeConfirm.loading") }}
          </p>
          <template v-else>
            <Message data-testid="revoke-confirm-info" severity="warn" :closable="false">
              {{
                newEmail
                  ? t("auth.emailChangeRevokeConfirm.bodyWithEmail", { email: newEmail })
                  : t("auth.emailChangeRevokeConfirm.body")
              }}
            </Message>
            <Button
              type="button"
              severity="danger"
              :label="t('auth.emailChangeRevokeConfirm.cancelButton')"
              :loading="submitting"
              :disabled="submitting"
              data-testid="confirm-revoke"
              @click="revoke"
            />
          </template>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          <router-link
            to="/signin"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.emailChangeRevokeConfirm.ctaSignIn") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
