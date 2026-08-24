<script lang="ts" setup>
import type { CreateApiKeyDto, CreatedApiKeyDto } from "@open-dpp/dto";
import { ApiKeyExpiryPresetDays } from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const model = defineModel<boolean>("visible");

const emit = defineEmits<{
  created: [];
}>();

const { t } = useI18n();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

const name = ref("");
const expiresInDays = ref<number | null>(null);
const busy = ref(false);
const createdKey = ref<CreatedApiKeyDto | null>(null);

const expiryOptions = computed(() => [
  { label: t("user.apiKeys.noExpiry"), value: null },
  ...ApiKeyExpiryPresetDays.map((days) => ({
    label: t("user.apiKeys.expiryDays", { days }),
    value: days,
  })),
]);

const canSubmit = computed(() => !busy.value && name.value.trim().length > 0);

watch(model, (visible) => {
  if (visible) {
    name.value = "";
    expiresInDays.value = null;
    createdKey.value = null;
  }
});

async function submit() {
  if (!canSubmit.value) return;
  busy.value = true;
  try {
    const body: CreateApiKeyDto = {
      name: name.value.trim(),
      expiresInDays: expiresInDays.value as CreateApiKeyDto["expiresInDays"],
    };
    const response = await apiClient.dpp.users.createApiKey(body);
    createdKey.value = response.data;
    emit("created");
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("user.apiKeys.createError"), e);
  } finally {
    busy.value = false;
  }
}

async function copyKey() {
  if (!createdKey.value) return;
  try {
    await navigator.clipboard.writeText(createdKey.value.key);
    notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("user.apiKeys.copyError"), e);
  }
}

function close() {
  model.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="createdKey ? t('user.apiKeys.createdTitle') : t('user.apiKeys.create')"
    :style="{ width: '30rem' }"
  >
    <template v-if="!createdKey">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="api-key-name">{{ t("user.apiKeys.name") }}</label>
          <InputText
            id="api-key-name"
            v-model="name"
            :placeholder="t('user.apiKeys.namePlaceholder')"
            data-testid="api-key-name-input"
            autofocus
            @keyup.enter="submit"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="api-key-expiry">{{ t("user.apiKeys.expiry") }}</label>
          <Select
            id="api-key-expiry"
            v-model="expiresInDays"
            :options="expiryOptions"
            option-label="label"
            option-value="value"
            data-testid="api-key-expiry-select"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col gap-4">
        <Message severity="warn" data-testid="api-key-show-once-hint">
          {{ t("user.apiKeys.createdHint") }}
        </Message>
        <InputGroup>
          <InputText readonly :value="createdKey.key" data-testid="api-key-created-value" />
          <InputGroupAddon>
            <Button
              icon="pi pi-copy"
              severity="secondary"
              :aria-label="t('common.copy')"
              :title="t('common.copy')"
              data-testid="api-key-copy-btn"
              @click="copyKey"
            />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </template>
    <template #footer>
      <template v-if="!createdKey">
        <Button :label="t('common.cancel')" severity="secondary" outlined @click="close" />
        <Button
          :label="t('user.apiKeys.create')"
          :disabled="!canSubmit"
          :loading="busy"
          data-testid="api-key-create-submit"
          @click="submit"
        />
      </template>
      <Button v-else :label="t('common.close')" data-testid="api-key-created-done" @click="close" />
    </template>
  </Dialog>
</template>
