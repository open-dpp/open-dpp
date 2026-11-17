<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";

const { t } = useI18n();

const email = ref<string>("");
const showError = ref<boolean>(false);
const showSuccess = ref<boolean>(false);
const loading = ref<boolean>(false);

async function requestPasswordReset() {
  try {
    await authClient.requestPasswordReset(
      {
        email: email.value,
      },
      {
        onRequest: () => {
          showError.value = false;
          showSuccess.value = false;
          loading.value = true;
        },
        onSuccess: () => {
          loading.value = false;
          showError.value = false;
          showSuccess.value = true;
        },
        onError: () => {
          loading.value = false;
          showError.value = true;
          showSuccess.value = false;
        },
      },
    );
    email.value = "";
  } catch {
    // console.log(error);
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
        <p class="py-2 text-center">
          {{ t("auth.passwordResetRequest.title") }}
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
          <Message
            v-if="showSuccess"
            class="mb-4"
            closable
            severity="success"
            @close="showSuccess = false"
          >
            {{ t("auth.passwordResetRequest.success") }}
          </Message>

          <form class="space-y-6" @submit.prevent="requestPasswordReset">
            <div>
              <label
                for="email"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >{{ t("user.email") }}</label
              >
              <div class="mt-2">
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  required
                  class="w-full"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                :loading="loading"
                class="w-full"
                :label="t('auth.passwordResetRequest.button')"
              />
            </div>
          </form>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          {{ t("auth.passwordResetRequest.rememberLogin") }}
          {{ " " }}
          <router-link
            to="/signin"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.passwordResetRequest.ctaSignIn") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
