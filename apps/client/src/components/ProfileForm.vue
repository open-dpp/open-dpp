<script lang="ts" setup>
import type { MeDto, UserDto } from "@open-dpp/dto";
import { Language, UpdateProfileDtoSchema } from "@open-dpp/dto";
import { toTypedSchema } from "@vee-validate/zod";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import SelectButton from "primevue/selectbutton";
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
} from "../composables/profile-form.ts";
import apiClient from "../lib/api-client.ts";
import { useNotificationStore } from "../stores/notification.ts";
import { convertLanguageToLocale } from "../translations/i18n.ts";

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
  <form class="profile-form" :aria-busy="isSubmitting" @submit.prevent="submitProfile">
    <ConfirmDialog />
    <header class="profile-form__header">
      <h1 class="profile-form__title">{{ t("user.profile") }}</h1>
      <p class="profile-form__subtitle">{{ t("user.profileSubtitle") }}</p>
    </header>

    <Message v-if="hydrationFailed" severity="error" class="profile-form__retry" :closable="false">
      <span>{{ t("user.profileLoadFailed") }}</span>
      <Button
        :label="t('user.profileLoadRetry')"
        severity="secondary"
        size="small"
        class="profile-form__retry-button"
        data-testid="retry"
        @click="retryHydrate"
      />
    </Message>

    <section class="profile-form__section" aria-labelledby="profile-form-name-heading">
      <h2 id="profile-form-name-heading" class="profile-form__section-title">
        {{ t("user.personalInformation") }}
      </h2>
      <p class="profile-form__helper">{{ t("user.nameHelper") }}</p>
      <div class="profile-form__row profile-form__row--two">
        <div class="profile-form__field">
          <label class="profile-form__label" for="profile-first-name">{{
            t("user.firstName")
          }}</label>
          <div
            v-if="!loaded && !hydrationFailed"
            class="profile-form__skeleton"
            aria-hidden="true"
          />
          <InputText
            v-else
            id="profile-first-name"
            v-model="firstName"
            autocomplete="given-name"
            class="profile-form__input"
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

        <div class="profile-form__field">
          <label class="profile-form__label" for="profile-last-name">{{
            t("user.lastName")
          }}</label>
          <div
            v-if="!loaded && !hydrationFailed"
            class="profile-form__skeleton"
            aria-hidden="true"
          />
          <InputText
            v-else
            id="profile-last-name"
            v-model="lastName"
            autocomplete="family-name"
            class="profile-form__input"
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

    <hr class="profile-form__rule" />

    <section class="profile-form__section" aria-labelledby="profile-form-email-heading">
      <h2 id="profile-form-email-heading" class="profile-form__section-title">
        {{ t("user.email") }}
      </h2>

      <div
        v-if="!loaded && !hydrationFailed"
        class="profile-form__email-row profile-form__email-row--skeleton"
        aria-hidden="true"
      >
        <div class="profile-form__email-current">
          <span class="profile-form__skeleton profile-form__skeleton--text" />
          <span class="profile-form__skeleton profile-form__skeleton--meta" />
        </div>
        <div class="profile-form__email-actions">
          <span class="profile-form__skeleton profile-form__skeleton--button" />
        </div>
      </div>
      <div v-else-if="loaded" class="profile-form__email-row">
        <div class="profile-form__email-current">
          <span class="profile-form__email-value">{{ currentEmail }}</span>
          <span
            v-if="pendingEmail"
            class="profile-form__chip profile-form__chip--pending"
            role="status"
            aria-live="polite"
          >
            {{ t("user.emailPending", { email: pendingEmail }) }}
          </span>
          <span v-if="pendingRequestedLabel" class="profile-form__email-meta">
            {{ pendingRequestedLabel }}
          </span>
        </div>
        <div class="profile-form__email-actions">
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

      <Transition name="profile-form__panel">
        <div
          v-if="emailPanelOpen && !pendingEmail"
          id="profile-email-panel"
          class="profile-form__panel"
          role="region"
          :aria-label="t('user.changeEmail')"
          @keydown="handleEmailKeydown"
        >
          <label class="profile-form__label" for="profile-new-email">{{
            t("user.newEmail")
          }}</label>
          <InputText
            id="profile-new-email"
            v-model="newEmail"
            type="email"
            autocomplete="email"
            class="profile-form__input"
            :invalid="!!newEmailError"
            :disabled="emailSubmitting"
            :aria-describedby="newEmailError ? 'profile-new-email-error' : 'profile-new-email-hint'"
            data-testid="new-email"
            autofocus
          />
          <p id="profile-new-email-hint" class="profile-form__helper">
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
          <div class="profile-form__field">
            <label class="profile-form__label" for="profile-current-password">
              {{ t("user.emailChangeCurrentPassword") }}
            </label>
            <InputText
              id="profile-current-password"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              class="profile-form__input"
              :invalid="!!currentPasswordError"
              :disabled="emailSubmitting"
              data-testid="current-password"
              @keydown="handleEmailKeydown"
            />
            <Message
              v-if="currentPasswordError"
              severity="error"
              variant="simple"
              size="small"
            >
              {{ currentPasswordError }}
            </Message>
          </div>
          <div class="profile-form__panel-actions">
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

    <hr class="profile-form__rule" />

    <section class="profile-form__section" aria-labelledby="profile-form-language-heading">
      <h2 id="profile-form-language-heading" class="profile-form__section-title">
        {{ t("user.language") }}
      </h2>
      <p class="profile-form__helper">{{ t("user.languageHelper") }}</p>
      <SelectButton
        v-model="preferredLanguage"
        :options="languageOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :disabled="!loaded || isSubmitting"
        aria-labelledby="profile-form-language-heading"
        class="profile-form__segmented"
      />
    </section>

    <hr class="profile-form__rule" />

    <div class="profile-form__actions">
      <div class="profile-form__saved-indicator" aria-live="polite">
        <Transition name="profile-form__saved-chip">
          <span v-if="savedChipVisible" class="profile-form__chip profile-form__chip--success">
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
        <span v-if="lastSavedLabel" class="profile-form__saved-time">{{ lastSavedLabel }}</span>
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

<style scoped>
.profile-form {
  width: 100%;
  max-width: 40rem; /* ~640px, keeps body line lengths between 65-75ch */
  display: flex;
  flex-direction: column;
  gap: 0;
}

.profile-form__header {
  margin-bottom: 24px;
}

.profile-form__title {
  font-size: 1.75rem; /* DESIGN.md Display tier */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0 0 4px 0;
}

.profile-form__subtitle {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--ink-muted);
  margin: 0;
}

.profile-form__retry {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-form__retry-button {
  margin-left: auto;
}

.profile-form__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 0;
}

.profile-form__section-title {
  font-size: 1.25rem; /* DESIGN.md Headline tier */
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.005em;
  color: var(--ink);
  margin: 0;
}

.profile-form__helper {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--ink-muted);
  margin: 0;
}

.profile-form__row {
  display: grid;
  gap: 16px;
}

.profile-form__row--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 640px) {
  .profile-form__row--two {
    grid-template-columns: minmax(0, 1fr);
  }
}

.profile-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px; /* DESIGN.md spacing.sm */
}

.profile-form__label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--ink);
}

.profile-form__input {
  width: 100%;
}

.profile-form__rule {
  border: 0;
  border-top: 1px solid var(--rule);
  margin: 0;
}

.profile-form__email-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--surface-recessed);
  border: 1px solid var(--rule);
  border-radius: 6px;
}

.profile-form__email-current {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  flex: 1 1 240px;
  min-width: 0;
}

.profile-form__email-value {
  font-size: 0.875rem;
  color: var(--ink);
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
}

.profile-form__email-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.profile-form__email-meta {
  font-size: 0.75rem;
  color: var(--ink-muted);
  line-height: 1.5;
}

.profile-form__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.04em;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.profile-form__chip--pending {
  background: color-mix(in srgb, var(--status-warning) 12%, var(--surface));
  color: var(--status-warning);
  border-color: color-mix(in srgb, var(--status-warning) 22%, var(--surface));
}

.profile-form__chip--success {
  background: color-mix(in srgb, var(--status-success) 12%, var(--surface));
  color: var(--status-success);
  border-color: color-mix(in srgb, var(--status-success) 22%, var(--surface));
}

.profile-form__saved-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  font-size: 0.75rem;
  color: var(--ink-muted);
  line-height: 1.5;
  min-height: 24px;
}

.profile-form__saved-time {
  font-variant-numeric: tabular-nums;
}

.profile-form__saved-chip-enter-active,
.profile-form__saved-chip-leave-active {
  transition:
    opacity 200ms cubic-bezier(0.25, 1, 0.5, 1),
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
}

.profile-form__saved-chip-enter-from,
.profile-form__saved-chip-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .profile-form__saved-chip-enter-active,
  .profile-form__saved-chip-leave-active {
    transition: none;
  }
}

.profile-form__skeleton {
  height: 38px; /* matches PrimeVue InputText default */
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--rule) 60%, var(--surface)),
    color-mix(in srgb, var(--rule) 100%, var(--surface)),
    color-mix(in srgb, var(--rule) 60%, var(--surface))
  );
  background-size: 200% 100%;
  animation: profile-form__skeleton-shimmer 1400ms ease-in-out infinite;
  display: block;
}

.profile-form__skeleton--text {
  height: 18px;
  width: min(280px, 70%);
  border-radius: 4px;
}

.profile-form__skeleton--meta {
  height: 14px;
  width: min(180px, 50%);
  border-radius: 4px;
  margin-top: 4px;
}

.profile-form__skeleton--button {
  height: 32px;
  width: 120px;
  border-radius: 6px;
}

.profile-form__email-row--skeleton {
  background: var(--surface-recessed);
}

@keyframes profile-form__skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-form__skeleton {
    animation: none;
    background: color-mix(in srgb, var(--rule) 80%, var(--surface));
  }
}

.profile-form__panel {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 10px; /* DESIGN.md rounded.lg */
}

.profile-form__panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.profile-form__panel-enter-active,
.profile-form__panel-leave-active {
  transition:
    opacity 200ms cubic-bezier(0.25, 1, 0.5, 1),
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
}

.profile-form__panel-enter-from,
.profile-form__panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .profile-form__panel-enter-active,
  .profile-form__panel-leave-active {
    transition: none;
  }
}

.profile-form__segmented {
  align-self: flex-start;
}

.profile-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 24px;
}
</style>
