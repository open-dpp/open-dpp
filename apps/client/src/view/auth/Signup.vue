<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod";
import { useToast } from "primevue/usetoast";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { Translation, useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import apiClient from "../../lib/api-client.ts";
import { continueOAuthSignup, readOAuthContinuation } from "../../lib/oauth-continuation.ts";
import { createSignupFormSchema } from "../../lib/signup-form.ts";
import { useInstanceSettingsStore } from "../../stores/instance-settings.ts";
import { convertLocaleToLanguage } from "../../translations/util.ts";

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();
const toast = useToast();

const loading = ref<boolean>(false);
const checkingSettings = ref<boolean>(true);
const instanceSettingsStore = useInstanceSettingsStore();

/** Which consent sentence fits the documents the instance links. */
const consentMessageKey = computed(() => {
  const { termsOfServiceUrl, privacyPolicyUrl } = instanceSettingsStore.legalLinks;
  if (termsOfServiceUrl && privacyPolicyUrl) return "auth.signup.consent.termsAndPrivacy";
  if (termsOfServiceUrl) return "auth.signup.consent.termsOnly";
  return "auth.signup.consent.privacyOnly";
});

const { handleSubmit, errors, submitCount, defineField } = useForm({
  validationSchema: computed(() =>
    toTypedSchema(createSignupFormSchema(instanceSettingsStore.consentRequired)),
  ),
  initialValues: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    termsAccepted: false,
  },
});

const [firstName, firstNameAttrs] = defineField("firstName");
const [lastName, lastNameAttrs] = defineField("lastName");
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [termsAccepted, termsAcceptedAttrs] = defineField("termsAccepted");

const showErrors = computed(() => {
  return submitCount.value > 0;
});

const redirectUri = computed(() => {
  return route.query.redirect ? decodeURIComponent(route.query.redirect as string) : "/";
});

/** Set when the OAuth Provider opened this page: the pending authorize request, sent back with the sign-up. */
const oauthContinuation = readOAuthContinuation(window.location.search);

onMounted(async () => {
  const outcome = await continueOAuthSignup(oauthContinuation, apiClient.dpp.oauthProvider);
  if (outcome === "continued") {
    return;
  }
  if (outcome === "failed") {
    // the form still renders: registering resumes the request as well
    toast.add({
      severity: "error",
      summary: t("auth.signup.oauthContinueError"),
      life: 5000,
    });
  }
  await instanceSettingsStore.fetchPublicSettings();
  checkingSettings.value = false;
});

const signup = handleSubmit(async (values) => {
  loading.value = true;
  try {
    const { data, error } = await authClient.signUp.email(
      oauthContinuation.withOAuthQuery({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        name: `${values.firstName} ${values.lastName}`,
        preferredLanguage: convertLocaleToLanguage(locale.value as string),
        callbackURL: redirectUri.value,
        // the server rejects a sign-up without consent while terms or privacy are linked
        ...(instanceSettingsStore.consentRequired
          ? { termsAccepted: values.termsAccepted === true }
          : {}),
      }),
    );

    if (error) {
      toast.add({
        severity: "error",
        summary: t("auth.signup.error"),
        life: 5000,
      });
      return;
    }
    // the provider resumed the authorize request, or sent the page back here to continue
    // a `prompt=create` request now that a session exists
    if (oauthContinuation.resumeFromResponse(data)) {
      return;
    }
    router.push("/signin");
  } catch {
    toast.add({
      severity: "error",
      summary: t("auth.signup.error"),
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <Card v-if="!checkingSettings" class="p-3 sm:mx-auto sm:w-full sm:max-w-md">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="py-2 text-center">
          {{ t("auth.signup.title") }}
        </p>
      </template>
      <template #content>
        <div v-if="!instanceSettingsStore.signupEnabled" class="flex flex-col gap-5">
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
                >{{ t("user.firstName") }}</label
              >
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
                >{{ t("user.lastName") }}</label
              >
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

            <div v-if="instanceSettingsStore.consentRequired">
              <div class="flex items-start gap-2">
                <Checkbox
                  v-model="termsAccepted"
                  v-bind="termsAcceptedAttrs"
                  input-id="termsAccepted"
                  binary
                  :disabled="loading"
                  :invalid="showErrors && !!errors.termsAccepted"
                  data-cy="terms-accepted"
                />
                <label for="termsAccepted" class="block text-sm/6 text-gray-900 dark:text-white">
                  <Translation :keypath="consentMessageKey" tag="span" scope="global">
                    <template #terms>
                      <a
                        :href="instanceSettingsStore.legalLinks.termsOfServiceUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >{{ t("legal.termsOfService") }}</a
                      >
                    </template>
                    <template #privacy>
                      <a
                        :href="instanceSettingsStore.legalLinks.privacyPolicyUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >{{ t("legal.privacyPolicy") }}</a
                      >
                    </template>
                  </Translation>
                </label>
              </div>
              <Message
                v-if="showErrors && errors.termsAccepted"
                size="small"
                severity="error"
                variant="simple"
              >
                {{ t("auth.signup.consent.required") }}
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
              query: route.query,
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
