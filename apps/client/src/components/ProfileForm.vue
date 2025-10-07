<script lang="ts" setup>
import { inject, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LAST_SELECTED_LANGUAGE } from "../const";
import { useProfileStore } from "../stores/profile";

const { t, locale } = useI18n();
const profileStore = useProfileStore();
const config = inject<{ locale: string }>(Symbol.for("FormKitConfig"));

watch(locale, (newLocale) => {
  localStorage.setItem(LAST_SELECTED_LANGUAGE, newLocale as string);
  if (config) {
    config.locale = newLocale.split("-")[0] as string;
  }
});
</script>

<template>
  <form>
    <div class="space-y-12">
      <div class="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            {{ t('user.personalInformation') }}
          </h2>
        </div>

        <div
          class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2"
        >
          <div class="sm:col-span-3">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="first-name"
            >{{ t('user.firstName') }}</label>
            <div class="mt-2">
              <input
                id="first-name"
                autocomplete="given-name"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="first-name"
                type="text"
                disabled
                :value="profileStore.profile?.firstName"
              >
            </div>
          </div>

          <div class="sm:col-span-3">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="last-name"
            >{{ t('user.lastName') }}</label>
            <div class="mt-2">
              <input
                id="last-name"
                autocomplete="family-name"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="last-name"
                type="text"
                disabled
                :value="profileStore.profile?.lastName"
              >
            </div>
          </div>

          <div class="sm:col-span-6">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="email"
            >{{ t('common.form.email.label') }}</label>
            <div class="mt-2">
              <input
                id="email"
                autocomplete="email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="email"
                type="email"
                disabled
                :value="profileStore.profile?.email"
              >
            </div>
          </div>
        </div>
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            {{ t('user.displaySettings') }}
          </h2>
        </div>

        <div
          class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2"
        >
          <div class="sm:col-span-6">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="email"
            >{{ t('user.language') }}</label>
            <div class="mt-2">
              <select
                id="email"
                v-model="locale"
                autocomplete="email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="language"
              >
                <option value="de-DE">
                  Deutsch
                </option>
                <option value="en-US">
                  English
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
