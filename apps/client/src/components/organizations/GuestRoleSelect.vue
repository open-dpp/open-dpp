<script lang="ts" setup>
import type { GuestRoleDtoType } from "@open-dpp/dto";
import Select from "primevue/select";
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";
import { useGuestRoles } from "../../composables/guest-roles.ts";

const model = defineModel<GuestRoleDtoType>({ required: true });

const { t } = useI18n();
const inputId = useId();
const { guestRoleOptions, getGuestRoleDescription } = useGuestRoles();
const description = computed(() => getGuestRoleDescription(model.value));
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="inputId" class="block text-sm font-medium text-gray-700">
      {{ t("guestAccess.role") }}
    </label>
    <Select
      v-model="model"
      :input-id="inputId"
      :options="guestRoleOptions"
      option-label="label"
      option-value="value"
      class="w-full"
    />
    <p v-if="description" class="text-sm text-gray-600" data-cy="guest-role-description">
      {{ description }}
    </p>
  </div>
</template>
