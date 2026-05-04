<script lang="ts" setup>
import type { MeDto, UserDto } from "@open-dpp/dto";
import { Language, UpdateProfileDtoSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import SelectButton from "primevue/selectbutton";
import Skeleton from "primevue/skeleton";
import { useConfirm } from "primevue/useconfirm";
import { useForm } from "vee-validate";
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import {
  computeProfileDiff,
  mapUserToFormValues,
  mergeUpdatedUserIntoOriginal,
  shouldSubmitEmailChange,
  type ProfileFormValues,
} from "../../composables/profile-form.ts";
import apiClient from "../../lib/api-client.ts";
import { useNotificationStore } from "../../stores/notification.ts";
import { convertLanguageToLocale } from "../../translations/i18n.ts";

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();
const confirm = useConfirm();

const SAVED_CHIP_DURATION_MS = 3000;

const profileSchema = UpdateProfileDtoSchema;
const newEmailSchema = z.email();

type ProfileFields = z.infer<typeof profileSchema>;

const { handleSubmit, defineField, setValues, errors, isSubmitting, meta, resetForm } =
  useForm<ProfileFields>({
    validationSchema: toTypedSchema(profileSchema),
    initialValues: {
      firstName: "",
      lastName: "",
      preferredLanguage: Language.en,
    },
  });

const [firstName] = defineField("firstName");
const [lastName] = defineField("lastName");
const [preferredLanguage] = defineField("preferredLanguage");

const loaded = ref(false);
const hydrationFailed = ref(false);
const user = ref<UserDto | null>(null);
const pendingEmailChange = ref<{ newEmail: string; requestedAt: Date } | null>(null);
const original = ref<ProfileFormValues | null>(null);

const emailPanelOpen = ref(false);
const newEmail = ref("");
const newEmailError = ref<string | null>(null);
const currentPassword = ref("");
const currentPasswordError = ref<string | null>(null);
const emailSubmitting = ref(false);
const cancelSubmitting = ref(false);
const changeEmailButtonRef = ref<ComponentPublicInstance | null>(null);
const cancelPendingButtonRef = ref<ComponentPublicInstance | null>(null);

const lastSavedAt = ref<Date | null>(null);
const savedChipVisible = ref(false);
let savedChipTimer: ReturnType<typeof setTimeout> | null = null;

const lastSavedLabel = computed(() => {
  const at = lastSavedAt.value;
  if (!at) return null;
  const formatted = new Intl.DateTimeFormat(locale.value, { timeStyle: "short" }).format(at);
  return t("user.profileSavedAt", { time: formatted });
});

function focusEmailRowAction() {
  void nextTick(() => {
    const instance = cancelPendingButtonRef.value ?? changeEmailButtonRef.value;
    const el = instance?.$el as HTMLElement | undefined;
    el?.focus?.();
  });
}

const languageOptions = computed(() => [
  { value: Language.en, label: t("languages.english") },
  { value: Language.de, label: t("languages.german") },
]);

const pendingEmail = computed(() => pendingEmailChange.value?.newEmail ?? null);
const pendingEmailRequestedAt = computed(() => pendingEmailChange.value?.requestedAt ?? null);
const pendingRequestedLabel = computed(() => {
  const at = pendingEmailRequestedAt.value;
  if (!at || Number.isNaN(at.getTime())) return null;
  const formatted = new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(at);
  return t("user.emailPendingRequestedAt", { time: formatted });
});
const currentEmail = computed(() => user.value?.email ?? "");

const canSendVerification = computed(() =>
  shouldSubmitEmailChange(newEmail.value.trim(), currentEmail.value),
);

async function hydrate() {
  hydrationFailed.value = false;
  const response = await apiClient.dpp.users.getMe();
  applyMe(response.data);
  loaded.value = true;
}

function applyMe(next: MeDto) {
  user.value = next.user;
  pendingEmailChange.value = next.pendingEmailChange
    ? {
        newEmail: next.pendingEmailChange.newEmail,
        requestedAt:
          next.pendingEmailChange.requestedAt instanceof Date
            ? next.pendingEmailChange.requestedAt
            : new Date(next.pendingEmailChange.requestedAt),
      }
    : null;
  const formValues = mapUserToFormValues(next.user);
  original.value = formValues;
  setValues(formValues);
  if (next.user.preferredLanguage) {
    locale.value = convertLanguageToLocale(next.user.preferredLanguage);
  }
}

onMounted(async () => {
  try {
    await hydrate();
  } catch (error) {
    console.error("Failed to load profile", error);
    hydrationFailed.value = true;
    notificationStore.addErrorNotification(t("user.profileLoadFailed"));
  }
});

async function retryHydrate() {
  try {
    await hydrate();
  } catch (error) {
    console.error("Failed to load profile", error);
    hydrationFailed.value = true;
    notificationStore.addErrorNotification(t("user.profileLoadFailed"));
  }
}

const showErrors = computed(() => meta.value.dirty || meta.value.touched);

function showSavedChip() {
  savedChipVisible.value = true;
  if (savedChipTimer) clearTimeout(savedChipTimer);
  savedChipTimer = setTimeout(() => {
    savedChipVisible.value = false;
  }, SAVED_CHIP_DURATION_MS);
}

const submitProfile = handleSubmit(async (formValues) => {
  if (!original.value) return;
  const diff = computeProfileDiff(formValues, original.value);
  if (Object.keys(diff).length === 0) return;

  try {
    const updated = await apiClient.dpp.users.updateProfile(diff);
    applyMe(updated.data);
    if (updated.data.user.preferredLanguage) {
      locale.value = convertLanguageToLocale(updated.data.user.preferredLanguage);
    }
    if (original.value) {
      original.value = mergeUpdatedUserIntoOriginal(updated.data.user, original.value);
    }
    resetForm({ values: mapUserToFormValues(updated.data.user) });
    lastSavedAt.value = new Date();
    showSavedChip();
    notificationStore.addSuccessNotification(t("user.profileSaved"));
  } catch (error) {
    console.error("Profile save failed", error);
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
  resetForm({ values: original.value });
}

function openEmailPanel() {
  newEmail.value = "";
  newEmailError.value = null;
  currentPassword.value = "";
  currentPasswordError.value = null;
  emailPanelOpen.value = true;
}

function closeEmailPanel() {
  emailPanelOpen.value = false;
  newEmail.value = "";
  newEmailError.value = null;
  currentPassword.value = "";
  currentPasswordError.value = null;
  focusEmailRowAction();
}

watch(newEmail, () => {
  newEmailError.value = null;
});

watch(currentPassword, () => {
  currentPasswordError.value = null;
});

async function sendVerification() {
  const candidate = newEmail.value.trim();
  const parsed = newEmailSchema.safeParse(candidate);
  if (!parsed.success) {
    newEmailError.value = t("common.form.email.invalid");
    return;
  }
  if (!currentPassword.value) {
    currentPasswordError.value = t("user.emailChangeCurrentPasswordRequired");
    return;
  }
  if (!canSendVerification.value) return;

  emailSubmitting.value = true;
  try {
    const updated = await apiClient.dpp.users.requestEmailChange({
      newEmail: candidate,
      currentPassword: currentPassword.value,
    });
    applyMe(updated.data);
    notificationStore.addInfoNotification(t("user.emailChangeRequested"));
    closeEmailPanel();
  } catch (error) {
    console.error("Email change request failed", error);
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 429) {
      newEmailError.value = t("user.emailChangeRateLimited");
    } else {
      const serverMessage = extractServerMessage(error, "user.emailChangeFailed");
      if (serverMessage.toLowerCase().includes("password")) {
        currentPasswordError.value = serverMessage;
      } else {
        newEmailError.value = serverMessage;
      }
    }
  } finally {
    emailSubmitting.value = false;
  }
}

function confirmCancelPending() {
  if (!pendingEmail.value || cancelSubmitting.value) return;
  confirm.require({
    header: t("user.emailChangeConfirmTitle"),
    message: t("user.emailChangeConfirmMessage"),
    acceptLabel: t("user.emailChangeConfirmYes"),
    rejectLabel: t("user.emailChangeConfirmNo"),
    acceptClass: "p-button-danger",
    accept: () => void cancelPending(),
  });
}

async function cancelPending() {
  cancelSubmitting.value = true;
  try {
    const updated = await apiClient.dpp.users.cancelEmailChange();
    applyMe(updated.data);
    notificationStore.addInfoNotification(t("user.emailChangeCancelled"));
  } catch (error) {
    console.error("Email change cancellation failed", error);
    notificationStore.addErrorNotification(
      extractServerMessage(error, "user.emailChangeCancelFailed"),
    );
  } finally {
    cancelSubmitting.value = false;
  }
}

function handleEmailKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeEmailPanel();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    void sendVerification();
  }
}
</script>

<template>
  <form
    class="flex w-full max-w-[40rem] flex-col"
    :aria-busy="isSubmitting"
    @submit.prevent="submitProfile"
  >
    <ConfirmDialog />
    <header class="mb-6">
      <h1 class="m-0 mb-1 text-3xl font-semibold leading-tight tracking-tight text-ink">
        {{ t("user.profile") }}
      </h1>
      <p class="m-0 text-sm text-ink-muted">{{ t("user.profileSubtitle") }}</p>
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
        class="m-0 text-xl font-semibold leading-snug tracking-tight text-ink"
      >
        {{ t("user.personalInformation") }}
      </h2>
      <p class="m-0 text-xs text-ink-muted">{{ t("user.nameHelper") }}</p>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium leading-snug text-ink" for="profile-first-name">
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
          <label class="text-sm font-medium leading-snug text-ink" for="profile-last-name">
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

    <hr class="m-0 border-0 border-t border-rule" />

    <section class="flex flex-col gap-3 py-6" aria-labelledby="profile-form-email-heading">
      <h2
        id="profile-form-email-heading"
        class="m-0 text-xl font-semibold leading-snug tracking-tight text-ink"
      >
        {{ t("user.email") }}
      </h2>

      <div
        v-if="!loaded && !hydrationFailed"
        class="flex flex-wrap items-start justify-between gap-4 rounded-md border border-rule bg-surface-recessed px-4 py-3"
        aria-hidden="true"
      >
        <div class="flex min-w-0 flex-1 basis-60 flex-col items-start gap-1.5">
          <Skeleton width="70%" height="1.125rem" />
          <Skeleton width="50%" height="0.875rem" />
        </div>
        <Skeleton width="7.5rem" height="2rem" />
      </div>
      <div
        v-else-if="loaded"
        class="flex flex-wrap items-start justify-between gap-4 rounded-md border border-rule bg-surface-recessed px-4 py-3"
      >
        <div class="flex min-w-0 flex-1 basis-60 flex-col items-start gap-1.5">
          <span class="max-w-full break-words text-sm text-ink">{{ currentEmail }}</span>
          <span
            v-if="pendingEmail"
            class="inline-flex max-w-full items-center gap-1 break-words rounded-full border border-status-warning/20 bg-status-warning/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-status-warning"
            role="status"
            aria-live="polite"
          >
            {{ t("user.emailPending", { email: pendingEmail }) }}
          </span>
          <span v-if="pendingRequestedLabel" class="text-xs leading-normal text-ink-muted">
            {{ pendingRequestedLabel }}
          </span>
        </div>
        <div class="flex shrink-0 gap-2">
          <Button
            v-if="pendingEmail"
            ref="cancelPendingButtonRef"
            type="button"
            severity="secondary"
            size="small"
            :label="t('user.cancelEmailChange')"
            :loading="cancelSubmitting"
            :disabled="cancelSubmitting"
            data-testid="cancel-pending"
            @click="confirmCancelPending"
          />
          <Button
            v-else-if="!emailPanelOpen"
            ref="changeEmailButtonRef"
            type="button"
            severity="secondary"
            size="small"
            :label="t('user.changeEmail')"
            aria-controls="profile-email-panel"
            :aria-expanded="emailPanelOpen"
            data-testid="change-email"
            @click="openEmailPanel"
          />
        </div>
      </div>

      <Transition
        enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
        enter-from-class="-translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <div
          v-if="emailPanelOpen && !pendingEmail"
          id="profile-email-panel"
          class="mt-3 flex flex-col gap-2 rounded-lg border border-rule bg-surface p-4"
          role="region"
          :aria-label="t('user.changeEmail')"
          @keydown="handleEmailKeydown"
        >
          <label class="text-sm font-medium leading-snug text-ink" for="profile-new-email">
            {{ t("user.newEmail") }}
          </label>
          <InputText
            id="profile-new-email"
            v-model="newEmail"
            type="email"
            autocomplete="email"
            class="w-full"
            :invalid="!!newEmailError"
            :disabled="emailSubmitting"
            :aria-describedby="newEmailError ? 'profile-new-email-error' : 'profile-new-email-hint'"
            data-testid="new-email"
            autofocus
          />
          <p id="profile-new-email-hint" class="m-0 text-xs text-ink-muted">
            {{ t("user.emailChangeHint") }}
          </p>
          <Message
            v-if="newEmailError"
            id="profile-new-email-error"
            severity="error"
            variant="simple"
            size="small"
          >
            {{ newEmailError }}
          </Message>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium leading-snug text-ink" for="profile-current-password">
              {{ t("user.emailChangeCurrentPassword") }}
            </label>
            <InputText
              id="profile-current-password"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full"
              :invalid="!!currentPasswordError"
              :disabled="emailSubmitting"
              data-testid="current-password"
              @keydown="handleEmailKeydown"
            />
            <Message v-if="currentPasswordError" severity="error" variant="simple" size="small">
              {{ currentPasswordError }}
            </Message>
          </div>
          <div class="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              severity="secondary"
              :label="t('user.cancel')"
              :disabled="emailSubmitting"
              @click="closeEmailPanel"
            />
            <Button
              type="button"
              :label="t('user.sendVerification')"
              :loading="emailSubmitting"
              :disabled="!canSendVerification || emailSubmitting"
              data-testid="send-verification"
              @click="sendVerification"
            />
          </div>
        </div>
      </Transition>
    </section>

    <hr class="m-0 border-0 border-t border-rule" />

    <section class="flex flex-col gap-3 py-6" aria-labelledby="profile-form-language-heading">
      <h2
        id="profile-form-language-heading"
        class="m-0 text-xl font-semibold leading-snug tracking-tight text-ink"
      >
        {{ t("user.language") }}
      </h2>
      <p class="m-0 text-xs text-ink-muted">{{ t("user.languageHelper") }}</p>
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

    <hr class="m-0 border-0 border-t border-rule" />

    <div class="flex justify-end gap-2 pt-6">
      <div
        class="mr-auto flex min-h-6 items-center gap-2 text-xs leading-normal text-ink-muted"
        aria-live="polite"
      >
        <Transition
          enter-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="motion-safe:transition motion-safe:duration-200 motion-safe:ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <span
            v-if="savedChipVisible"
            class="inline-flex items-center gap-1 rounded-full border border-status-success/20 bg-status-success/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-status-success"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path
                d="M3.5 8.5L6.5 11.5L12.5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ t("user.profileSaved") }}
          </span>
        </Transition>
        <span v-if="lastSavedLabel" class="tabular-nums">{{ lastSavedLabel }}</span>
      </div>
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
