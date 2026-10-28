<script lang="ts" setup>
import type { GuestRoleDtoType } from "@open-dpp/dto";
import { EnvelopeIcon } from "@heroicons/vue/24/outline";
import { GuestRoleDto } from "@open-dpp/dto";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useGuestAccess } from "../../composables/guest-access.ts";
import RingLoader from "../navigation/RingLoader.vue";
import GuestRoleSelect from "./GuestRoleSelect.vue";

const emit = defineEmits<{
  (e: "success"): void;
}>();

const { t } = useI18n();
const { inviteGuest } = useGuestAccess();

const visible = ref(false);
const loading = ref(false);
const success = ref(false);
const email = ref("");
const emailError = ref("");
const guestRole = ref<GuestRoleDtoType>(GuestRoleDto.REPAIRER);

async function invite() {
  if (!z.email().safeParse(email.value.trim()).success) {
    emailError.value = t("common.form.email.invalid");
    return;
  }
  emailError.value = "";
  loading.value = true;
  const invited = await inviteGuest(email.value, guestRole.value);
  loading.value = false;
  if (invited) {
    success.value = true;
    emit("success");
  }
}

// Every time the dialog opens it starts with an empty form
function open() {
  email.value = "";
  emailError.value = "";
  guestRole.value = GuestRoleDto.REPAIRER;
  success.value = false;
  visible.value = true;
}

defineExpose({ open });
</script>

<template>
  <Dialog v-model:visible="visible" modal class="w-3/4" :header="t('guestAccess.invite')">
    <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
      <EnvelopeIcon aria-hidden="true" class="size-6 text-green-600" />
    </div>
    <div class="mt-3 text-center sm:mt-5">
      <div v-if="success" class="mt-3">
        <div class="text-sm text-green-600">{{ t("guestAccess.inviteSuccess") }}</div>
        <Button class="mt-3" :label="t('common.close')" @click="visible = false" />
      </div>
      <div v-else class="mt-3">
        <form v-show="!loading" class="flex flex-col gap-4 text-left" @submit.prevent="invite">
          <div class="flex flex-col gap-2">
            <label for="guest-email" class="block text-sm font-medium text-gray-700">
              {{ t("guestAccess.email") }}
            </label>
            <InputText
              id="guest-email"
              v-model="email"
              type="text"
              :invalid="!!emailError"
              class="w-full"
            />
            <small v-if="emailError" class="text-red-600">{{ emailError }}</small>
          </div>
          <GuestRoleSelect v-model="guestRole" />
          <Button :label="t('guestAccess.invite')" type="submit" class="w-full" />
        </form>
        <RingLoader v-show="loading" class="mx-auto w-fit" />
      </div>
    </div>
  </Dialog>
</template>
