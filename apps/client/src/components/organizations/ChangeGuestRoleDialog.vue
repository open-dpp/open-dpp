<script lang="ts" setup>
import type { GuestAccessResponseDto, GuestRoleDtoType } from "@open-dpp/dto";
import Button from "primevue/button";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useGuestAccess } from "../../composables/guest-access.ts";
import GuestRoleSelect from "./GuestRoleSelect.vue";

const emit = defineEmits<{
  (e: "success"): void;
}>();

const { t } = useI18n();
const { changeGuestRole } = useGuestAccess();

const visible = ref(false);
const loading = ref(false);
const guestAccess = ref<GuestAccessResponseDto | null>(null);
const guestRole = ref<GuestRoleDtoType | undefined>(undefined);

// Every time the dialog opens it starts with the current role of the guest
function open(guestAccessToChange: GuestAccessResponseDto) {
  guestAccess.value = guestAccessToChange;
  guestRole.value = guestAccessToChange.guestRole;
  visible.value = true;
}

async function save() {
  if (!guestAccess.value || !guestRole.value) {
    return;
  }
  loading.value = true;
  const changed = await changeGuestRole(guestAccess.value.id, guestRole.value);
  loading.value = false;
  if (changed) {
    visible.value = false;
    emit("success");
  }
}

defineExpose({ open });
</script>

<template>
  <Dialog v-model:visible="visible" modal class="w-3/4" :header="t('guestAccess.changeRole')">
    <form v-if="guestAccess && guestRole" class="flex flex-col gap-4" @submit.prevent="save">
      <div class="text-sm text-gray-700">{{ guestAccess.email }}</div>
      <GuestRoleSelect v-model="guestRole" />
      <Button
        type="submit"
        class="w-full"
        :label="t('guestAccess.changeRole')"
        :loading="loading"
        :disabled="guestRole === guestAccess.guestRole"
      />
    </form>
  </Dialog>
</template>
