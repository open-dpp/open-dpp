<script lang="ts" setup>
import {
  Button,
  Card,
  Checkbox,
  InputText,
  Message,
  Password,
} from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import apiClient from "../../lib/api-client.ts";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations.ts";

const indexStore = useIndexStore();
const organizationsStore = useOrganizationsStore();
const route = useRoute();
const { t } = useI18n();

const email = ref<string>("");
const password = ref<string>("");
const rememberMe = ref<boolean>(false);
const showError = ref<boolean>(false);
const loading = ref<boolean>(false);
const signupEnabled = ref<boolean>(true);

onMounted(async () => {
  try {
    const res = await apiClient.dpp.instanceSettings.getPublic();
    signupEnabled.value = res.data.signupEnabled;
  }
  catch {
    signupEnabled.value = true;
  }
});

const redirectUri = computed(() => {
  return route.query.redirect
    ? decodeURIComponent(route.query.redirect as string)
    : "/";
});

async function signin() {
  try {
    await authClient.signIn.email(
      {
        email: email.value,
        password: password.value,
        callbackURL: redirectUri.value,
        rememberMe: rememberMe.value,
      },
      {
        onRequest() {
          showError.value = false;
          loading.value = true;
        },
        onError() {
          loading.value = false;
          showError.value = true;
        },
      },
    );
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
  catch {
    showError.value = true;
  }
  finally {
    loading.value = false;
    password.value = "";
  }
}
</script>

<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <Card class="sm:mx-auto sm:w-full sm:max-w-md p-3">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="text-center py-2">
          {{ t("auth.signin.title") }}
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
            {{ t("auth.signin.error") }}
          </Message>

          <form class="space-y-6" @submit.prevent="signin()">
            <div>
              <label
                for="email"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t("user.email") }}</label>
              <div class="mt-2">
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  required="true"
                  class="w-full"
                  :disabled="loading"
                />
              </div>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t("user.password") }}</label>
              <div class="mt-2">
                <Password
                  v-model="password"
                  fluid
                  input-id="password"
                  :feedback="false"
                  toggle-mask
                  :input-props="{
                    name: 'password',
                    autocomplete: 'current-password',
                    required: true,
                  }"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Checkbox v-model="rememberMe" input-id="remember-me" binary />
                <label
                  for="remember-me"
                  class="block text-sm/6 text-gray-900 dark:text-white"
                >{{ t("auth.signin.rememberMe") }}</label>
              </div>

              <div class="text-sm/6">
                <router-link
                  to="/password-reset-request"
                  class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {{ t("auth.signin.forgotPassword") }}
                </router-link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                :loading="loading"
                class="w-full"
                :label="t('auth.signin.button')"
              />
            </div>
          </form>
        </div>
      </template>
      <template v-if="signupEnabled" #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          {{ t("auth.signin.notAMember") }}
          {{ " " }}
          <router-link
            :to="{
              name: 'Signup',
              query: {
                redirect: redirectUri,
              },
            }"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.signin.ctaSignUp") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
