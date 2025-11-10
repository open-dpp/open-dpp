<script lang="ts" setup>
import { Button, Card, Message, Password } from "primevue";
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
    await authClient.resetPassword({
      newPassword: newPassword.value,
      token,
    }, {
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
    });
  }
  catch {
    // console.log(error);
  }
}

onMounted(() => {
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    token.value = urlToken;
  }
  else {
    router.push("/signin");
  }
});
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <Card class="sm:mx-auto sm:w-full sm:max-w-md p-3">
      <template #header>
        <img class="mx-auto h-10 w-auto" src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Ebene_1'%20data-name='Ebene%201'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201080.69%20226.77'%3e%3cdefs%3e%3cstyle%3e%20.cls-1%20{%20fill:%20%23b4dedf;%20}%20.cls-1,%20.cls-2,%20.cls-3%20{%20stroke-width:%200px;%20}%20.cls-2%20{%20fill:%20%2380caaf;%20}%20.cls-3%20{%20fill:%20%2340afd7;%20}%20%3c/style%3e%3c/defs%3e%3cg%3e%3cpath%20class='cls-2'%20d='m169.24,86.9c-10.21-8.46-23.33-13.55-37.63-13.55-32.55,0-58.93,26.34-58.93,58.83,0,9.98,2.49,19.39,6.89,27.62-13.02-10.79-21.31-27.08-21.31-45.29,0-32.49,26.39-58.84,58.93-58.84,22.55,0,42.15,12.65,52.05,31.23Z'/%3e%3cpath%20class='cls-3'%20d='m120.14,168.04c9.38-1.6,18.28-6.35,24.96-14.13,15.19-17.69,13.15-44.33-4.58-59.5-5.44-4.66-11.73-7.7-18.28-9.15,11.96-2.04,24.71,1.06,34.65,9.56,17.72,15.17,19.77,41.81,4.58,59.5-10.53,12.26-26.57,17-41.33,13.72Z'/%3e%3cpath%20class='cls-1'%20d='m126.01,153.23c-13.14,7.58-29.95,3.08-37.54-10.04-5.26-9.09-4.71-19.94.49-28.26-1.04,6.09-.04,12.56,3.29,18.33,7.59,13.12,24.4,17.62,37.54,10.04,4.04-2.33,7.26-5.52,9.56-9.21-1.33,7.76-5.98,14.9-13.35,19.15Z'/%3e%3c/g%3e%3cg%3e%3cpath%20class='cls-2'%20d='m301.04,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m421.64,119.99h-88c1.6,22,18.4,36.6,41.4,36.6,12.8,0,24.2-4.6,32.2-13.8l8,9.2c-9.4,11.2-24,17.2-40.6,17.2-32.8,0-55.2-22.4-55.2-53.6s21.8-53.4,51.4-53.4,51,21.8,51,53.4c0,1.2-.2,2.8-.2,4.4Zm-88-10.6h74.6c-1.8-20.6-16.8-35-37.4-35s-35.4,14.4-37.2,35Z'/%3e%3cpath%20class='cls-2'%20d='m547.64,107.19v61h-14.2v-59.6c0-22.2-11.6-33.6-31.6-33.6-22.6,0-36.8,14-36.8,38v55.2h-14.2V62.99h13.6v19.4c7.6-12.8,21.8-20.2,40-20.2,25.6,0,43.2,14.8,43.2,45Z'/%3e%3cpath%20class='cls-2'%20d='m573.44,107.79h52.4v12.4h-52.4v-12.4Z'/%3e%3cpath%20class='cls-2'%20d='m750.63,19.79v148.4h-13.6v-20.8c-8.6,14.2-23.2,21.8-40.6,21.8-30,0-52.4-21.8-52.4-53.6s22.4-53.4,52.4-53.4c16.8,0,31.2,7.2,40,20.8V19.79h14.2Zm-14,95.8c0-24.6-16.8-41-39-41s-39.2,16.4-39.2,41,16.8,41,39.2,41,39-16.4,39-41Z'/%3e%3cpath%20class='cls-2'%20d='m891.83,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m1022.43,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3c/g%3e%3c/svg%3e" alt="open-dpp">
      </template>
      <template #title>
        <p class="text-center py-2">
          {{ t('auth.passwordReset.title') }}
        </p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <Message v-if="showError" class="mb-4" closable severity="error" @close="showError = false">
            {{ t('common.unknownErrorOccured') }}
          </Message>

          <div class="space-y-6">
            <div>
              <label for="newPassword" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.password') }}</label>
              <div class="mt-2">
                <Password v-model="newPassword" input-id="newPassword" :feedback="false" toggle-mask class="w-full" :input-props="{ name: 'newPassword', autocomplete: 'new-password', required: true }" />
              </div>
            </div>

            <div>
              <label for="newPasswordCheck" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.passwordRepeat') }}</label>
              <div class="mt-2">
                <Password v-model="newPasswordCheck" input-id="newPasswordCheck" :feedback="false" toggle-mask class="w-full" :input-props="{ name: 'newPasswordCheck', autocomplete: 'off', required: true }" />
              </div>
            </div>

            <div>
              <Button :loading="loading" class="w-full" :label="t('auth.passwordReset.button')" @click="requestPasswordReset" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          {{ t('auth.passwordReset.rememberLogin') }}
          {{ ' ' }}
          <router-link to="/signin" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            {{ t('auth.passwordReset.ctaSignIn') }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
