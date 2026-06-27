<script lang="ts" setup>
import type { MeDto } from "@open-dpp/dto";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import { useConfirm } from "primevue/useconfirm";
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import apiClient from "../../lib/api-client.ts";
import { useNotificationStore } from "../../stores/notification.ts";

const props = defineProps<{
  email: string;
  pendingEmailChange: { newEmail: string; requestedAt: Date } | null;
  loaded: boolean;
  hydrationFailed: boolean;
}>();

const emit = defineEmits<{
  (event: "updated", me: MeDto): void;
}>();

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();
const confirm = useConfirm();

const newEmailSchema = z.email();

const emailPanelOpen = ref(false);
const newEmail = ref("");
const newEmailError = ref<string | null>(null);
const currentPassword = ref("");
const currentPasswordError = ref<string | null>(null);
const emailSubmitting = ref(false);
const cancelSubmitting = ref(false);
const changeEmailButtonRef = ref<ComponentPublicInstance | null>(null);
const cancelPendingButtonRef = ref<ComponentPublicInstance | null>(null);

function focusEmailRowAction() {
  void nextTick(() => {
    const instance = cancelPendingButtonRef.value ?? changeEmailButtonRef.value;
    const el = instance?.$el as HTMLElement | undefined;
    el?.focus?.();
  });
}

const pendingEmail = computed(() => props.pendingEmailChange?.newEmail ?? null);
const pendingEmailRequestedAt = computed(() => props.pendingEmailChange?.requestedAt ?? null);
const pendingRequestedLabel = computed(() => {
  const at = pendingEmailRequestedAt.value;
  if (!at || Number.isNaN(at.getTime())) return null;
  const formatted = new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(at);
  return t("user.emailPendingRequestedAt", { time: formatted });
});
const currentEmail = computed(() => props.email);

const canSendVerification = computed(() => {
  const candidate = newEmail.value.trim();
  return candidate.length > 0 && candidate !== currentEmail.value;
});

function extractServerMessage(error: unknown, fallbackKey: string): string {
  const maybeMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
    return maybeMessage;
  }
  return t(fallbackKey);
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
  if (emailSubmitting.value) return;
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
    emit("updated", updated.data);
    notificationStore.addInfoNotification(t("user.emailChangeRequested"));
    closeEmailPanel();
  } catch (error) {
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
    emit("updated", updated.data);
    notificationStore.addInfoNotification(t("user.emailChangeCancelled"));
  } catch (error) {
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
  <section class="flex flex-col gap-3" aria-labelledby="profile-form-email-heading">
    <ConfirmDialog />
    <h2
      id="profile-form-email-heading"
      class="text-ink m-0 text-xl leading-snug font-semibold tracking-tight"
    >
      {{ t("user.email") }}
    </h2>

    <div
      v-if="!loaded && !hydrationFailed"
      class="border-rule bg-surface-recessed flex flex-wrap items-start justify-between gap-4 rounded-md border px-4 py-3"
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
      class="border-rule bg-surface-recessed flex flex-wrap items-start justify-between gap-4 rounded-md border px-4 py-3"
    >
      <div class="my-auto flex min-w-0 flex-1 basis-60 flex-col items-start gap-1.5">
        <span class="text-ink max-w-full text-sm wrap-break-word">{{ currentEmail }}</span>
        <span
          v-if="pendingEmail"
          class="border-status-warning/20 bg-status-warning/10 text-status-warning inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wider wrap-break-word"
          role="status"
          aria-live="polite"
        >
          {{ t("user.emailPending", { email: pendingEmail }) }}
        </span>
        <span v-if="pendingRequestedLabel" class="text-ink-muted text-xs leading-normal">
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
        class="border-rule bg-surface mt-3 flex flex-col gap-2 rounded-lg border p-4"
        role="region"
        :aria-label="t('user.changeEmail')"
        @keydown="handleEmailKeydown"
      >
        <label class="text-ink text-sm leading-snug font-medium" for="profile-new-email">
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
        <p id="profile-new-email-hint" class="text-ink-muted m-0 text-xs">
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
          <label class="text-ink text-sm leading-snug font-medium" for="profile-current-password">
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
            :aria-describedby="currentPasswordError ? 'profile-current-password-error' : undefined"
            data-testid="current-password"
          />
          <Message
            v-if="currentPasswordError"
            id="profile-current-password-error"
            severity="error"
            variant="simple"
            size="small"
          >
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
</template>
