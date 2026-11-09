<script lang="ts" setup>
import Button from "primevue/button";
import { useI18n } from "vue-i18n";
import ProfileForm from "../../components/profile/ProfileForm.vue";
import { useGuestProfile } from "../../composables/guest-profile.ts";

const { t } = useI18n();
const { backTarget, goBack, signOut } = useGuestProfile();
</script>

<template>
  <div class="min-h-screen bg-gray-50/50">
    <header class="border-b border-gray-100 bg-white px-4 py-3 sm:px-8">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-2">
        <Button
          v-if="backTarget"
          icon="pi pi-arrow-left"
          :label="t('user.backToPassport')"
          text
          data-testid="guest-profile-back"
          @click="goBack"
        />
        <span v-else />
        <Button
          icon="pi pi-sign-out"
          :label="t('user.logout')"
          text
          data-testid="guest-profile-sign-out"
          @click="signOut"
        />
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6 sm:px-8" data-testid="guest-profile">
      <h1 class="mb-4 text-lg font-semibold text-gray-900">{{ t("user.profile") }}</h1>
      <ProfileForm />
    </main>
  </div>
</template>
