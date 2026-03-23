<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod";
import { useToast } from "primevue/usetoast";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import apiClient from "../../lib/api-client.ts";
import { SignupFormSchema } from "../../lib/signup-form.ts";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const toast = useToast();

const loading = ref<boolean>(false);
const signupEnabled = ref<boolean>(true);
const checkingSettings = ref<boolean>(true);

const { handleSubmit, errors, submitCount, defineField } = useForm({
  validationSchema: toTypedSchema(SignupFormSchema),
  initialValues: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  },
});

const [firstName, firstNameAttrs] = defineField("firstName");
const [lastName, lastNameAttrs] = defineField("lastName");
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const showErrors = computed(() => {
  return submitCount.value > 0;
});

const redirectUri = computed(() => {
  return route.query.redirect
    ? decodeURIComponent(route.query.redirect as string)
    : "/";
});

onMounted(async () => {
  try {
    const res = await apiClient.dpp.instanceSettings.getPublic();
    signupEnabled.value = res.data.signupEnabled;
  }
  catch {
    // If we can't fetch settings, assume signup is enabled
    signupEnabled.value = true;
  }
  finally {
    checkingSettings.value = false;
  }
});

const signup = handleSubmit(async (values) => {
  loading.value = true;
  const { error } = await authClient.signUp.email({
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    name: `${values.firstName} ${values.lastName}`,
    callbackURL: redirectUri.value,
  });
  loading.value = false;

  if (error) {
    toast.add({
      severity: "error",
      summary: t("auth.signup.error"),
      life: 5000,
    });
  }
  else {
    router.push("/signin");
  }
});
</script>

<template>
  <div
    class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <Card v-if="!checkingSettings" class="sm:mx-auto sm:w-full sm:max-w-md p-3">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="text-center py-2">
          {{ t("auth.signup.title") }}
        </p>
      </template>
      <template #content>
        <div v-if="!signupEnabled" class="flex flex-col gap-5">
          <Message severity="warn" :closable="false">
            {{ t("auth.signup.disabled") }}
          </Message>
        </div>
        <div v-else class="flex flex-col gap-5">
          <form class="space-y-6" @submit.prevent="signup">
            <div>
              <label
                for="firstName"
                class="block text-sm/6 font-medium text-gray-900 dark:text-white"
              >{{ t("user.firstName") }}</label>
              <div class="mt-2">
                <InputText
                  id="firstName"
                  v-model="firstName"
                  v-bind="firstNameAttrs"
                  type="text"
                  name="given-name"
                  autocomplete="given-name"
                  class="w-full"
                  :disabled="loading"
                  :invalid="showErrors && !!errors.firstName"
                />
              </div>
              <Message
                v-if="showErrors && errors.firstName"
                size="small"
                severity="error"
                variant="simple"
              >
                {{ errors.firstName }}
              </Message>
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
                  v-bind="lastNameAttrs"
                  type="text"
                  name="lastName"
                  autocomplete="family-name"
                  class="w-full"
                  :disabled="loading"
                  :invalid="showErrors && !!errors.lastName"
                />
              </div>
              <Message
                v-if="showErrors && errors.lastName"
                size="small"
                severity="error"
                variant="simple"
              >
                {{ errors.lastName }}
              </Message>
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
              >{{ t("user.password") }}</label>
              <div class="mt-2">
                <Password
                  v-model="password"
                  v-bind="passwordAttrs"
                  input-id="password"
                  :feedback="false"
                  toggle-mask
                  fluid
                  :disabled="loading"
                  :invalid="showErrors && !!errors.password"
                  :input-props="{
                    name: 'password',
                    autocomplete: 'new-password',
                  }"
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
