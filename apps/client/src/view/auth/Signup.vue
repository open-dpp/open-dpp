<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import { useNotificationStore } from "../../stores/notification.ts";

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const { t } = useI18n();

const firstName = ref<string>("");
const lastName = ref<string>("");
const email = ref<string>("");
const password = ref<string>("");

const redirectUri = computed(() => {
  return route.query.redirect ? decodeURIComponent(route.query.redirect as string) : "/";
});

async function signup() {
  await authClient.signUp.email({
    email: email.value,
    password: password.value,
    firstName: firstName.value,
    lastName: lastName.value,
    name: `${firstName.value} ${lastName.value}`,
    callbackURL: redirectUri.value,
  }, {
    onRequest: () => {
      // show loading
    },
    onSuccess: () => {
      router.push("/signin");
    },
    onError: (ctx) => {
      notificationStore.addErrorNotification(ctx.error.message);
    },
  });
}
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <img class="mx-auto h-10 w-auto" src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Ebene_1'%20data-name='Ebene%201'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201080.69%20226.77'%3e%3cdefs%3e%3cstyle%3e%20.cls-1%20{%20fill:%20%23b4dedf;%20}%20.cls-1,%20.cls-2,%20.cls-3%20{%20stroke-width:%200px;%20}%20.cls-2%20{%20fill:%20%2380caaf;%20}%20.cls-3%20{%20fill:%20%2340afd7;%20}%20%3c/style%3e%3c/defs%3e%3cg%3e%3cpath%20class='cls-2'%20d='m169.24,86.9c-10.21-8.46-23.33-13.55-37.63-13.55-32.55,0-58.93,26.34-58.93,58.83,0,9.98,2.49,19.39,6.89,27.62-13.02-10.79-21.31-27.08-21.31-45.29,0-32.49,26.39-58.84,58.93-58.84,22.55,0,42.15,12.65,52.05,31.23Z'/%3e%3cpath%20class='cls-3'%20d='m120.14,168.04c9.38-1.6,18.28-6.35,24.96-14.13,15.19-17.69,13.15-44.33-4.58-59.5-5.44-4.66-11.73-7.7-18.28-9.15,11.96-2.04,24.71,1.06,34.65,9.56,17.72,15.17,19.77,41.81,4.58,59.5-10.53,12.26-26.57,17-41.33,13.72Z'/%3e%3cpath%20class='cls-1'%20d='m126.01,153.23c-13.14,7.58-29.95,3.08-37.54-10.04-5.26-9.09-4.71-19.94.49-28.26-1.04,6.09-.04,12.56,3.29,18.33,7.59,13.12,24.4,17.62,37.54,10.04,4.04-2.33,7.26-5.52,9.56-9.21-1.33,7.76-5.98,14.9-13.35,19.15Z'/%3e%3c/g%3e%3cg%3e%3cpath%20class='cls-2'%20d='m301.04,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m421.64,119.99h-88c1.6,22,18.4,36.6,41.4,36.6,12.8,0,24.2-4.6,32.2-13.8l8,9.2c-9.4,11.2-24,17.2-40.6,17.2-32.8,0-55.2-22.4-55.2-53.6s21.8-53.4,51.4-53.4,51,21.8,51,53.4c0,1.2-.2,2.8-.2,4.4Zm-88-10.6h74.6c-1.8-20.6-16.8-35-37.4-35s-35.4,14.4-37.2,35Z'/%3e%3cpath%20class='cls-2'%20d='m547.64,107.19v61h-14.2v-59.6c0-22.2-11.6-33.6-31.6-33.6-22.6,0-36.8,14-36.8,38v55.2h-14.2V62.99h13.6v19.4c7.6-12.8,21.8-20.2,40-20.2,25.6,0,43.2,14.8,43.2,45Z'/%3e%3cpath%20class='cls-2'%20d='m573.44,107.79h52.4v12.4h-52.4v-12.4Z'/%3e%3cpath%20class='cls-2'%20d='m750.63,19.79v148.4h-13.6v-20.8c-8.6,14.2-23.2,21.8-40.6,21.8-30,0-52.4-21.8-52.4-53.6s22.4-53.4,52.4-53.4c16.8,0,31.2,7.2,40,20.8V19.79h14.2Zm-14,95.8c0-24.6-16.8-41-39-41s-39.2,16.4-39.2,41,16.8,41,39.2,41,39-16.4,39-41Z'/%3e%3cpath%20class='cls-2'%20d='m891.83,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m1022.43,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3c/g%3e%3c/svg%3e" alt="open-dpp">
      <h2 class="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
        {{ t('auth.signup.title') }}
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div class="space-y-6">
          <div>
            <label for="firstName" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.firstName') }}</label>
            <div class="mt-2">
              <input id="firstName" v-model="firstName" type="text" name="given-name" autocomplete="firstname" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div>
            <label for="lastName" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.lastName') }}</label>
            <div class="mt-2">
              <input id="lastName" v-model="lastName" type="text" name="lastName" autocomplete="family-name" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.email') }}</label>
            <div class="mt-2">
              <input id="email" v-model="email" type="email" name="email" autocomplete="email" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm/6 font-medium text-gray-900 dark:text-white">{{ t('user.password') }}</label>
            <div class="mt-2">
              <input id="password" v-model="password" type="password" name="password" autocomplete="new-password" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div>
            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500" @click="signup">
              {{ t('auth.signup.button') }}
            </button>
          </div>
        </div>
      </div>

      <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
        {{ t('auth.signup.alreadyAMember') }}
        {{ ' ' }}
        <router-link
          :to="{
            name: 'Signin',
            query: {
              redirect: redirectUri,
            },
          }" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          {{ t('auth.signup.ctaSignIn') }}
        </router-link>
      </p>
    </div>
  </div>
</template>
