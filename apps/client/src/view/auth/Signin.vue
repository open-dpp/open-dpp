<script lang="ts" setup>
import { ref } from "vue";
import { authClient } from "../../auth-client.ts";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations.ts";

const indexStore = useIndexStore();
const organizationsStore = useOrganizationsStore();

const email = ref<string>("");
const password = ref<string>("");

async function signin() {
  await authClient.signIn.email({
    /**
     * The user email
     */
    email: email.value,
    /**
     * The user password
     */
    password: password.value,
    /**
     * A URL to redirect to after the user verifies their email (optional)
     */
    callbackURL: "/",
    /**
     * remember the user session after the browser is closed.
     * @default true
     */
    rememberMe: false,
  }, {
    // callbacks
  });
  await organizationsStore.fetchOrganizations();
  const lastSelectedOrganization = indexStore.selectedOrganization;
  if (
    !organizationsStore.organizations.find(
      organization => organization.id === lastSelectedOrganization,
    )
  ) {
    indexStore.selectOrganization(null);
  }
}
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <img class="mx-auto h-10 w-auto dark:hidden" src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20id='Ebene_1'%20data-name='Ebene%201'%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201080.69%20226.77'%3e%3cdefs%3e%3cstyle%3e%20.cls-1%20{%20fill:%20%23b4dedf;%20}%20.cls-1,%20.cls-2,%20.cls-3%20{%20stroke-width:%200px;%20}%20.cls-2%20{%20fill:%20%2380caaf;%20}%20.cls-3%20{%20fill:%20%2340afd7;%20}%20%3c/style%3e%3c/defs%3e%3cg%3e%3cpath%20class='cls-2'%20d='m169.24,86.9c-10.21-8.46-23.33-13.55-37.63-13.55-32.55,0-58.93,26.34-58.93,58.83,0,9.98,2.49,19.39,6.89,27.62-13.02-10.79-21.31-27.08-21.31-45.29,0-32.49,26.39-58.84,58.93-58.84,22.55,0,42.15,12.65,52.05,31.23Z'/%3e%3cpath%20class='cls-3'%20d='m120.14,168.04c9.38-1.6,18.28-6.35,24.96-14.13,15.19-17.69,13.15-44.33-4.58-59.5-5.44-4.66-11.73-7.7-18.28-9.15,11.96-2.04,24.71,1.06,34.65,9.56,17.72,15.17,19.77,41.81,4.58,59.5-10.53,12.26-26.57,17-41.33,13.72Z'/%3e%3cpath%20class='cls-1'%20d='m126.01,153.23c-13.14,7.58-29.95,3.08-37.54-10.04-5.26-9.09-4.71-19.94.49-28.26-1.04,6.09-.04,12.56,3.29,18.33,7.59,13.12,24.4,17.62,37.54,10.04,4.04-2.33,7.26-5.52,9.56-9.21-1.33,7.76-5.98,14.9-13.35,19.15Z'/%3e%3c/g%3e%3cg%3e%3cpath%20class='cls-2'%20d='m301.04,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m421.64,119.99h-88c1.6,22,18.4,36.6,41.4,36.6,12.8,0,24.2-4.6,32.2-13.8l8,9.2c-9.4,11.2-24,17.2-40.6,17.2-32.8,0-55.2-22.4-55.2-53.6s21.8-53.4,51.4-53.4,51,21.8,51,53.4c0,1.2-.2,2.8-.2,4.4Zm-88-10.6h74.6c-1.8-20.6-16.8-35-37.4-35s-35.4,14.4-37.2,35Z'/%3e%3cpath%20class='cls-2'%20d='m547.64,107.19v61h-14.2v-59.6c0-22.2-11.6-33.6-31.6-33.6-22.6,0-36.8,14-36.8,38v55.2h-14.2V62.99h13.6v19.4c7.6-12.8,21.8-20.2,40-20.2,25.6,0,43.2,14.8,43.2,45Z'/%3e%3cpath%20class='cls-2'%20d='m573.44,107.79h52.4v12.4h-52.4v-12.4Z'/%3e%3cpath%20class='cls-2'%20d='m750.63,19.79v148.4h-13.6v-20.8c-8.6,14.2-23.2,21.8-40.6,21.8-30,0-52.4-21.8-52.4-53.6s22.4-53.4,52.4-53.4c16.8,0,31.2,7.2,40,20.8V19.79h14.2Zm-14,95.8c0-24.6-16.8-41-39-41s-39.2,16.4-39.2,41,16.8,41,39.2,41,39-16.4,39-41Z'/%3e%3cpath%20class='cls-2'%20d='m891.83,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3cpath%20class='cls-2'%20d='m1022.43,115.59c0,32-22.4,53.6-52.4,53.6-16.8,0-31.2-7.2-40-20.8v58.6h-14.2V62.99h13.6v20.8c8.6-14,23.2-21.6,40.6-21.6,30,0,52.4,21.6,52.4,53.4Zm-14.2,0c0-24.4-17-41-39.2-41s-39.2,16.6-39.2,41,16.8,41,39.2,41,39.2-16.4,39.2-41Z'/%3e%3c/g%3e%3c/svg%3e" alt="Your Company">
      <img class="mx-auto h-10 w-auto not-dark:hidden" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company">
      <h2 class="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div class="space-y-6">
          <div>
            <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Email address</label>
            <div class="mt-2">
              <input id="email" v-model="email" type="email" name="email" autocomplete="email" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Password</label>
            <div class="mt-2">
              <input id="password" v-model="password" type="password" name="password" autocomplete="current-password" required="true" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500">
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex gap-3">
              <div class="flex h-6 shrink-0 items-center">
                <div class="group grid size-4 grid-cols-1">
                  <input id="remember-me" name="remember-me" type="checkbox" class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 forced-colors:appearance-auto">
                  <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25" viewBox="0 0 14 14" fill="none">
                    <path class="opacity-0 group-has-checked:opacity-100" d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
              <label for="remember-me" class="block text-sm/6 text-gray-900 dark:text-white">Remember me</label>
            </div>

            <div class="text-sm/6">
              <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Forgot password?</a>
            </div>
          </div>

          <div>
            <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500" @click="signin">
              Sign in
            </button>
          </div>
        </div>

        <div>
          <div class="mt-10 flex items-center gap-x-6">
            <div class="w-full flex-1 border-t border-gray-200 dark:border-white/10" />
            <p class="text-sm/6 font-medium text-nowrap text-gray-900 dark:text-white">
              Or continue with
            </p>
            <div class="w-full flex-1 border-t border-gray-200 dark:border-white/10" />
          </div>

          <div class="mt-6 grid grid-cols-2 gap-4">
            <a href="#" class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
              <svg class="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              <span class="text-sm/6 font-semibold">Google</span>
            </a>

            <a href="#" class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">
              <svg class="size-5 fill-[#24292F] dark:fill-white" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm/6 font-semibold">GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
        Not a member?
        {{ ' ' }}
        <router-link to="/signup" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
          Sign up now
        </router-link>
      </p>
    </div>
  </div>
</template>
