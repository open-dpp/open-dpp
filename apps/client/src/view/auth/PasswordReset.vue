<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";

const router = useRouter();
const { t } = useI18n();

const newPassword = ref<string>("");
const newPasswordCheck = ref<string>("");
const token = ref<string | null>(null);
const showError = ref<boolean>(false);
const loading = ref<boolean>(false);

async function requestPasswordReset() {
  const token = new URLSearchParams(window.location.search).get("token");
  if (newPassword.value !== newPasswordCheck.value || !token) {
    return;
  }
  try {
    await authClient.resetPassword(
      {
        newPassword: newPassword.value,
        token,
      },
      {
        onRequest: () => {
          showError.value = false;
          loading.value = true;
        },
        onSuccess: () => {
          router.push("/signin");
          loading.value = false;
        },
        onError: () => {
          loading.value = false;
          showError.value = true;
        },
      },
    );
  } catch {
    loading.value = false;
    showError.value = true;
  }
}

onMounted(() => {
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    token.value = urlToken;
  } else {
    router.push("/signin");
  }
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
          {{ t("auth.passwordReset.title") }}
        </p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <Message
            v-if="showError"
            class="mb-4"
            closable
            severity="error"
            @close="showError = false"
          >
            {{ t("common.unknownErrorOccurred") }}
          </Message>

          <form class="space-y-6" @submit.prevent="requestPasswordReset">
            <div>
              <label
                for="newPassword"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >{{ t("user.password") }}</label
              >
              <div class="mt-2">
                <Password
                  v-model="newPassword"
                  input-id="newPassword"
                  :feedback="false"
                  toggle-mask
                  fluid
                  :disabled="loading"
                  :input-props="{
                    name: 'newPassword',
                    autocomplete: 'new-password',
                    required: true,
                  }"
                />
              </div>
            </div>

            <div>
              <label
                for="newPasswordCheck"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >{{ t("user.passwordRepeat") }}</label
              >
              <div class="mt-2">
                <Password
                  v-model="newPasswordCheck"
                  input-id="newPasswordCheck"
                  :feedback="false"
                  fluid
                  toggle-mask
                  :disabled="loading"
                  :input-props="{ name: 'newPasswordCheck', autocomplete: 'off', required: true }"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                :loading="loading"
                class="w-full"
                :label="t('auth.passwordReset.button')"
              />
            </div>
          </form>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          {{ t("auth.passwordReset.rememberLogin") }}
          {{ " " }}
          <router-link
            to="/signin"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.passwordReset.ctaSignIn") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
