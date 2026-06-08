<script lang="ts" setup>
import type { MeDto, UserDto } from "@open-dpp/dto";
import { Language, UpdateProfileDtoSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import SelectButton from "primevue/selectbutton";
import Skeleton from "primevue/skeleton";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import {
  computeProfileDiff,
  mapUserToFormValues,
  type ProfileFormValues,
} from "../../composables/profile-form.ts";
import apiClient from "../../lib/api-client.ts";
import { useNotificationStore } from "../../stores/notification.ts";
import { convertLanguageToLocale } from "../../translations/i18n.ts";
import EmailChangeCard from "./EmailChangeCard.vue";

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();

const profileSchema = UpdateProfileDtoSchema;

type ProfileFields = z.infer<typeof profileSchema>;

const { handleSubmit, defineField, errors, isSubmitting, meta, resetForm } = useForm<ProfileFields>(
  {
    validationSchema: toTypedSchema(profileSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      preferredLanguage: Language.en,
    },
  },
);

const [firstName] = defineField("firstName");
const [lastName] = defineField("lastName");
const [preferredLanguage] = defineField("preferredLanguage");

const loaded = ref(false);
const hydrationFailed = ref(false);
const user = ref<UserDto | null>(null);
const pendingEmailChange = ref<{ newEmail: string; requestedAt: Date } | null>(null);
const original = ref<ProfileFormValues | null>(null);

const languageOptions = computed(() => [
  { value: Language.en, label: t("languages.english") },
  { value: Language.de, label: t("languages.german") },
]);

const currentEmail = computed(() => user.value?.email ?? "");

async function hydrate() {
  hydrationFailed.value = false;
  const response = await apiClient.dpp.users.getMe();
  applyMe(response.data);
  loaded.value = true;
}

function toProfileFields(values: ProfileFormValues): ProfileFields {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    preferredLanguage: values.preferredLanguage,
  };
}

function toPendingEmailChange(next: MeDto): { newEmail: string; requestedAt: Date } | null {
  if (!next.pendingEmailChange) return null;
  return {
    newEmail: next.pendingEmailChange.newEmail,
    requestedAt:
      next.pendingEmailChange.requestedAt instanceof Date
        ? next.pendingEmailChange.requestedAt
        : new Date(next.pendingEmailChange.requestedAt),
  };
}

function applyMe(next: MeDto) {
  user.value = next.user;
  pendingEmailChange.value = toPendingEmailChange(next);
  const formValues = mapUserToFormValues(next.user);
  original.value = formValues;
  resetForm({ values: toProfileFields(formValues) });
  if (next.user.preferredLanguage) {
    locale.value = convertLanguageToLocale(next.user.preferredLanguage);
  }
}

function onEmailUpdated(next: MeDto) {
  applyMe(next);
}

onMounted(async () => {
  try {
    await hydrate();
  } catch (error) {
    hydrationFailed.value = true;
    notificationStore.addErrorNotification(t("user.profileLoadFailed"));
  }
});

async function retryHydrate() {
  try {
    await hydrate();
  } catch (error) {
    hydrationFailed.value = true;
    notificationStore.addErrorNotification(t("user.profileLoadFailed"));
  }
}

const showErrors = computed(() => meta.value.dirty || meta.value.touched);

const submitProfile = handleSubmit(async (formValues) => {
  if (!original.value) return;
  const diff = computeProfileDiff(formValues, original.value);
  if (Object.keys(diff).length === 0) return;

  try {
    const updated = await apiClient.dpp.users.updateProfile(diff);
    applyMe(updated.data);
    notificationStore.addSuccessNotification(t("user.profileSaved"));
  } catch (error) {
    notificationStore.addErrorNotification(extractServerMessage(error, "user.profileSaveFailed"));
  }
});

function extractServerMessage(error: unknown, fallbackKey: string): string {
  const maybeMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
    return maybeMessage;
  }
  return t(fallbackKey);
}

function discard() {
  if (!original.value) return;
  resetForm({ values: toProfileFields(original.value) });
}
</script>

<template>
  <form
    class="flex w-full max-w-160 flex-col"
    :aria-busy="isSubmitting"
    @submit.prevent="submitProfile"
  >
    <header class="mb-6">
      <h1 class="text-ink m-0 mb-1 text-3xl leading-tight font-semibold tracking-tight">
        {{ t("user.profile") }}
      </h1>
      <p class="text-ink-muted m-0 text-sm">{{ t("user.profileSubtitle") }}</p>
    </header>

    <Message v-if="hydrationFailed" severity="error" class="mb-6" :closable="false">
      <div class="flex w-full items-center gap-3">
        <span>{{ t("user.profileLoadFailed") }}</span>
        <Button
          :label="t('user.profileLoadRetry')"
          severity="secondary"
          size="small"
          class="ml-auto"
          data-testid="retry"
          @click="retryHydrate"
        />
      </div>
    </Message>

    <section class="flex flex-col gap-3 py-6" aria-labelledby="profile-form-name-heading">
      <h2
        id="profile-form-name-heading"
        class="text-ink m-0 text-xl leading-snug font-semibold tracking-tight"
      >
        {{ t("user.personalInformation") }}
      </h2>
      <p class="text-ink-muted m-0 text-xs">{{ t("user.nameHelper") }}</p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-ink text-sm leading-snug font-medium" for="profile-first-name">
            {{ t("user.firstName") }}
          </label>
          <Skeleton v-if="!loaded && !hydrationFailed" height="2.375rem" />
          <InputText
            v-else
            id="profile-first-name"
            v-model="firstName"
            autocomplete="given-name"
            class="w-full"
            :invalid="showErrors && !!errors.firstName"
            :disabled="isSubmitting"
            :aria-describedby="
              showErrors && errors.firstName ? 'profile-first-name-error' : undefined
            "
          />
          <Message
            v-if="showErrors && errors.firstName"
            id="profile-first-name-error"
            severity="error"
            variant="simple"
            size="small"
          >
            {{ errors.firstName }}
          </Message>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-ink text-sm leading-snug font-medium" for="profile-last-name">
            {{ t("user.lastName") }}
          </label>
          <Skeleton v-if="!loaded && !hydrationFailed" height="2.375rem" />
          <InputText
            v-else
            id="profile-last-name"
            v-model="lastName"
            autocomplete="family-name"
            class="w-full"
            :invalid="showErrors && !!errors.lastName"
            :disabled="isSubmitting"
            :aria-describedby="
              showErrors && errors.lastName ? 'profile-last-name-error' : undefined
            "
          />
          <Message
            v-if="showErrors && errors.lastName"
            id="profile-last-name-error"
            severity="error"
            variant="simple"
            size="small"
          >
            {{ errors.lastName }}
          </Message>
        </div>
      </div>
    </section>

    <hr class="border-rule m-0 border-0 border-t" />

    <section class="py-6">
      <EmailChangeCard
        :email="currentEmail"
        :pending-email-change="pendingEmailChange"
        :loaded="loaded"
        :hydration-failed="hydrationFailed"
        @updated="onEmailUpdated"
      />
    </section>

    <hr class="border-rule m-0 border-0 border-t" />

    <section class="flex flex-col gap-3 py-6" aria-labelledby="profile-form-language-heading">
      <h2
        id="profile-form-language-heading"
        class="text-ink m-0 text-xl leading-snug font-semibold tracking-tight"
      >
        {{ t("user.language") }}
      </h2>
      <p class="text-ink-muted m-0 text-xs">{{ t("user.languageHelper") }}</p>
      <SelectButton
        v-model="preferredLanguage"
        :options="languageOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :disabled="!loaded || isSubmitting"
        aria-labelledby="profile-form-language-heading"
        class="self-start"
      />
    </section>

    <hr class="border-rule m-0 border-0 border-t" />

    <div class="flex justify-end gap-2 pt-6">
      <Button
        v-if="meta.dirty"
        type="button"
        severity="secondary"
        :label="t('user.discardChanges')"
        :disabled="isSubmitting"
        @click="discard"
      />
      <Button
        type="submit"
        :label="t('user.save')"
        :loading="isSubmitting"
        :disabled="!loaded || !meta.dirty"
      />
    </div>
  </form>
</template>
