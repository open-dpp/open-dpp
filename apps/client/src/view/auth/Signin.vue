<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod";
import { useToast } from "primevue/usetoast";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import apiClient from "../../lib/api-client.ts";
import { SigninFormSchema } from "../../lib/signin-form.ts";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations.ts";
import { useStatusStore } from "../../stores/status.ts";

const indexStore = useIndexStore();
const organizationsStore = useOrganizationsStore();
const statusStore = useStatusStore();
const route = useRoute();
const { t } = useI18n();
const toast = useToast();

const rememberMe = ref<boolean>(false);
const loading = ref<boolean>(false);
const signupEnabled = ref<boolean>(false);
const checkingSettings = ref<boolean>(true);

const { handleSubmit, errors, submitCount, defineField, resetField } = useForm({
  validationSchema: toTypedSchema(SigninFormSchema),
  initialValues: {
    email: "",
    password: "",
  },
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const showErrors = computed(() => {
  return submitCount.value > 0;
});

onMounted(async () => {
  await statusStore.fetchStatus();
  try {
    const res = await apiClient.dpp.instanceSettings.getPublic();
    signupEnabled.value = res.data.signupEnabled;
  } catch {
    signupEnabled.value = false;
  } finally {
    checkingSettings.value = false;
  }
});

const redirectUri = computed(() => {
  return route.query.redirect ? decodeURIComponent(route.query.redirect as string) : "/";
});

const signin = handleSubmit(async (values) => {
  loading.value = true;
  try {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: redirectUri.value,
      rememberMe: rememberMe.value,
    });

    if (error) {
      toast.add({
        severity: "error",
        summary: t("auth.signin.error"),
        life: 5000,
      });
      resetField("password");
      return;
    }

    await organizationsStore.fetchOrganizations();
    const lastSelectedOrganization = indexStore.selectedOrganization;
    if (
      !organizationsStore.organizations.find(
        (organization) => organization.id === lastSelectedOrganization,
      )
    ) {
      indexStore.selectOrganization(null);
    }
  } catch {
    toast.add({
      severity: "error",
      summary: t("auth.signin.error"),
      life: 5000,
    });
    resetField("password");
  } finally {
    loading.value = false;
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
          {{ t("auth.signin.title") }}
        </p>
      </template>
      <template #content>
        <div class="flex flex-col gap-5">
          <form class="space-y-6" @submit.prevent="signin">
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
                  v-bind="emailAttrs"
                  type="email"
                  name="email"
                  autocomplete="email"
                  class="w-full"
                  :disabled="loading"
                  :invalid="showErrors && !!errors.email"
                />
              </div>
              <Message
                v-if="showErrors && errors.email"
                size="small"
                severity="error"
                variant="simple"
              >
                {{ errors.email }}
              </Message>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
                >{{ t("user.password") }}</label
              >
              <div class="mt-2">
                <Password
                  v-model="password"
                  v-bind="passwordAttrs"
                  fluid
                  input-id="password"
                  :feedback="false"
                  toggle-mask
                  :input-props="{
                    name: 'password',
                    autocomplete: 'current-password',
                  }"
                  :disabled="loading"
                  :invalid="showErrors && !!errors.password"
                />
              </div>
              <Message
                v-if="showErrors && errors.password"
                size="small"
                severity="error"
                variant="simple"
              >
                {{ errors.password }}
              </Message>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Checkbox v-model="rememberMe" input-id="remember-me" binary />
                <label for="remember-me" class="block text-sm/6 text-gray-900 dark:text-white">{{
                  t("auth.signin.rememberMe")
                }}</label>
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
      <template v-if="!checkingSettings && signupEnabled" #footer>
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
    <p v-if="statusStore.version" class="mt-4 text-center text-xs text-gray-500">
      v{{ statusStore.version }}
    </p>
  </div>
</template>
