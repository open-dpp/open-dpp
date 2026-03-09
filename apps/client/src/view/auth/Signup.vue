<script lang="ts" setup>
import { Button, Card, InputText, Message, Password } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const firstName = ref<string>("");
const lastName = ref<string>("");
const email = ref<string>("");
const password = ref<string>("");
const showError = ref<boolean>(false);
const loading = ref<boolean>(false);

const redirectUri = computed(() => {
  return route.query.redirect
    ? decodeURIComponent(route.query.redirect as string)
    : "/";
});

async function signup() {
  await authClient.signUp.email(
    {
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      name: `${firstName.value} ${lastName.value}`,
      callbackURL: redirectUri.value,
    },
    {
      onRequest: () => {
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
          {{ t("auth.signup.title") }}
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
            {{ t("auth.signup.error") }}
          </Message>

          <form class="space-y-6" @submit.prevent="signup()">
            <div>
              <label
                for="firstName"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t("user.firstName") }}</label>
              <div class="mt-2">
                <InputText
                  id="firstName"
                  v-model="firstName"
                  type="text"
                  name="given-name"
                  autocomplete="given-name"
                  required
                  class="w-full"
                  :disabled="loading"
                />
              </div>
            </div>

            <div>
              <label
                for="lastName"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t("user.lastName") }}</label>
              <div class="mt-2">
                <InputText
                  id="lastName"
                  v-model="lastName"
                  type="text"
                  name="lastName"
                  autocomplete="family-name"
                  required
                  class="w-full"
                  :disabled="loading"
                />
              </div>
            </div>

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
                  required
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
                  input-id="password"
                  :feedback="false"
                  toggle-mask
                  fluid
                  :disabled="loading"
                  :input-props="{
                    name: 'password',
                    autocomplete: 'new-password',
                    required: true,
                  }"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                :loading="loading"
                :disabled="loading"
                class="w-full"
                :label="t('auth.signup.button')"
              />
            </div>
          </form>
        </div>
      </template>
      <template #footer>
        <p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          {{ t("auth.signup.alreadyAMember") }}
          {{ " " }}
          <router-link
            :to="{
              name: 'Signin',
              query: {
                redirect: redirectUri,
              },
            }"
            class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {{ t("auth.signup.ctaSignIn") }}
          </router-link>
        </p>
      </template>
    </Card>
  </div>
</template>
