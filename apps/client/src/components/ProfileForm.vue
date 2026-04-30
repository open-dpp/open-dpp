<script lang="ts" setup>
import { Language, UpdateProfileDtoSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { authClient } from "../auth-client.ts";
import {
  computeProfileDiff,
  mapUserToFormValues,
  mergeUpdatedUserIntoOriginal,
  type ProfileFormValues,
} from "../composables/profile-form.ts";
import apiClient from "../lib/api-client.ts";
import { useNotificationStore } from "../stores/notification.ts";
import { convertLanguageToLocale } from "../translations/i18n.ts";

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();
const session = authClient.useSession();

const formSchema = UpdateProfileDtoSchema.extend({
  email: z.email(),
});

type FormValues = z.infer<typeof formSchema>;

const { handleSubmit, defineField, setValues, errors, isSubmitting, meta } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    firstName: "",
    lastName: "",
    email: "",
    preferredLanguage: Language.en,
  },
});

const [firstName] = defineField("firstName");
const [lastName] = defineField("lastName");
const [email] = defineField("email");
const [preferredLanguage] = defineField("preferredLanguage");

const loaded = ref(false);
const original = ref<ProfileFormValues | null>(null);

async function hydrate() {
  const response = await apiClient.dpp.users.getMe();
  const user = response.data;
  const hydrated = mapUserToFormValues(user);
  original.value = hydrated;
  setValues(hydrated);
  if (user.preferredLanguage) {
    locale.value = convertLanguageToLocale(user.preferredLanguage);
  }
  loaded.value = true;
}

onMounted(async () => {
  try {
    await hydrate();
  } catch (error) {
    console.error("Failed to load profile", error);
    notificationStore.addErrorNotification(t("user.profileLoadFailed"));
  }
});

const showErrors = computed(() => meta.value.dirty || meta.value.touched);

const submit = handleSubmit(async (formValues) => {
  if (!original.value) return;
  const profileDiff = computeProfileDiff(formValues, original.value);
  const emailChanged = formValues.email !== original.value.email;
  let profileUpdated = false;
  let step: "profile" | "email" = "profile";

  try {
    if (Object.keys(profileDiff).length > 0) {
      step = "profile";
      const updated = await apiClient.dpp.users.updateProfile(profileDiff);
      profileUpdated = true;
      if (updated.data.preferredLanguage) {
        locale.value = convertLanguageToLocale(updated.data.preferredLanguage);
      }
      original.value = mergeUpdatedUserIntoOriginal(updated.data, original.value);
      notificationStore.addSuccessNotification(t("user.profileSaved"));
    }
    if (emailChanged) {
      step = "email";
      await apiClient.dpp.users.requestEmailChange({ newEmail: formValues.email });
      notificationStore.addInfoNotification(t("user.emailChangeRequested"));
      setValues({ email: original.value.email });
    }
  } catch (error) {
    console.error(`Profile submit failed at step "${step}"`, error);
    notificationStore.addErrorNotification(
      t(step === "email" ? "user.emailChangeFailed" : "user.profileSaveFailed"),
    );
  }

  if (profileUpdated) {
    try {
      await session.value.refetch?.();
    } catch (error) {
      console.warn("Session refetch failed after profile update", error);
    }
  }
});

const languageOptions = computed(() => [
  { value: Language.en, label: t("languages.english") },
  { value: Language.de, label: t("languages.german") },
]);
</script>

<template>
  <form @submit.prevent="submit">
    <div class="space-y-12">
      <div class="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
        <div>
          <h2 class="text-base leading-7 font-semibold text-gray-900">
            {{ t("user.personalInformation") }}
          </h2>
        </div>

        <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
          <div class="sm:col-span-3">
            <label class="block text-sm leading-6 font-medium text-gray-900" for="first-name">{{
              t("user.firstName")
            }}</label>
            <div class="mt-2">
              <InputText
                id="first-name"
                v-model="firstName"
                autocomplete="given-name"
                class="w-full"
                :invalid="showErrors && !!errors.firstName"
                :disabled="!loaded || isSubmitting"
              />
              <Message
                v-if="showErrors && errors.firstName"
                severity="error"
                variant="simple"
                size="small"
                class="mt-1"
              >
                {{ errors.firstName }}
              </Message>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label class="block text-sm leading-6 font-medium text-gray-900" for="family-name">{{
              t("user.lastName")
            }}</label>
            <div class="mt-2">
              <InputText
                id="family-name"
                v-model="lastName"
                autocomplete="family-name"
                class="w-full"
                :invalid="showErrors && !!errors.lastName"
                :disabled="!loaded || isSubmitting"
              />
              <Message
                v-if="showErrors && errors.lastName"
                severity="error"
                variant="simple"
                size="small"
                class="mt-1"
              >
                {{ errors.lastName }}
              </Message>
            </div>
          </div>

          <div class="sm:col-span-6">
            <label class="block text-sm leading-6 font-medium text-gray-900" for="email">{{
              t("common.form.email.label")
            }}</label>
            <div class="mt-2">
              <InputText
                id="email"
                v-model="email"
                autocomplete="email"
                type="email"
                class="w-full"
                :invalid="showErrors && !!errors.email"
                :disabled="!loaded || isSubmitting"
              />
              <small class="mt-1 block text-gray-600">{{ t("user.emailChangeHint") }}</small>
              <Message
                v-if="showErrors && errors.email"
                severity="error"
                variant="simple"
                size="small"
                class="mt-1"
              >
                {{ errors.email }}
              </Message>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-base leading-7 font-semibold text-gray-900">
            {{ t("user.displaySettings") }}
          </h2>
        </div>

        <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
          <div class="sm:col-span-6">
            <label class="block text-sm leading-6 font-medium text-gray-900" for="language">{{
              t("user.language")
            }}</label>
            <div class="mt-2">
              <Select
                id="language"
                v-model="preferredLanguage"
                :options="languageOptions"
                option-label="label"
                option-value="value"
                class="w-full"
                :disabled="!loaded || isSubmitting"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          type="submit"
          :label="t('user.save')"
          :loading="isSubmitting"
          :disabled="!loaded"
        />
      </div>
    </div>
  </form>
</template>
