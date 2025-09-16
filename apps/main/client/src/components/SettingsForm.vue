<!--
  This example requires some changes to your config:

  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
-->
<template>
  <form>
    <div class="space-y-12">
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            Profile
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            This information will be displayed publicly so be careful what you
            share.
          </p>
        </div>

        <div
          class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2"
        >
          <div class="sm:col-span-4">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="website"
              >Website</label
            >
            <div class="mt-2">
              <div
                class="flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md"
              >
                <span
                  class="flex select-none items-center pl-3 text-gray-500 sm:text-sm"
                  >http://</span
                >
                <input
                  id="website"
                  class="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                  name="website"
                  placeholder="www.example.com"
                  type="text"
                />
              </div>
            </div>
          </div>

          <div class="col-span-full">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="about"
              >About</label
            >
            <div class="mt-2">
              <textarea
                id="about"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="about"
                rows="3"
              />
            </div>
            <p class="mt-3 text-sm leading-6 text-gray-600">
              Write a few sentences about yourself.
            </p>
          </div>

          <div class="col-span-full">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="photo"
              >Photo</label
            >
            <div class="mt-2 flex items-center gap-x-3">
              <UserCircleIcon
                aria-hidden="true"
                class="h-12 w-12 text-gray-300"
              />
              <button
                class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                type="button"
              >
                Change
              </button>
            </div>
          </div>

          <div class="col-span-full">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="cover-photo"
              >Cover photo</label
            >
            <div
              class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
            >
              <div class="text-center">
                <PhotoIcon
                  aria-hidden="true"
                  class="mx-auto h-12 w-12 text-gray-300"
                />
                <div class="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    for="file-upload"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      class="sr-only"
                      name="file-upload"
                      type="file"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs leading-5 text-gray-600">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            Personal Information
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            Use a permanent address where you can receive mail.
          </p>
        </div>

        <div
          class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2"
        >
          <div class="sm:col-span-3">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="first-name"
              >First name</label
            >
            <div class="mt-2">
              <input
                id="first-name"
                autocomplete="given-name"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="first-name"
                type="text"
              />
            </div>
          </div>

          <div class="sm:col-span-3">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="last-name"
              >Last name</label
            >
            <div class="mt-2">
              <input
                id="last-name"
                autocomplete="family-name"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="last-name"
                type="text"
              />
            </div>
          </div>

          <div class="sm:col-span-4">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="email"
              >Email address</label
            >
            <div class="mt-2">
              <input
                id="email"
                autocomplete="email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="email"
                type="email"
              />
            </div>
          </div>

          <div class="sm:col-span-3">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="country"
              >Country</label
            >
            <div class="mt-2">
              <select
                id="country"
                autocomplete="country-name"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                name="country"
              >
                <option>United States</option>
                <option>Canada</option>
                <option>Mexico</option>
              </select>
            </div>
          </div>

          <div class="col-span-full">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="street-address"
              >Street address</label
            >
            <div class="mt-2">
              <input
                id="street-address"
                autocomplete="street-address"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="street-address"
                type="text"
              />
            </div>
          </div>

          <div class="sm:col-span-2 sm:col-start-1">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="city"
              >City</label
            >
            <div class="mt-2">
              <input
                id="city"
                autocomplete="address-level2"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="city"
                type="text"
              />
            </div>
          </div>

          <div class="sm:col-span-2">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="region"
              >State / Province</label
            >
            <div class="mt-2">
              <input
                id="region"
                autocomplete="address-level1"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="region"
                type="text"
              />
            </div>
          </div>

          <div class="sm:col-span-2">
            <label
              class="block text-sm font-medium leading-6 text-gray-900"
              for="postal-code"
              >ZIP / Postal code</label
            >
            <div class="mt-2">
              <input
                id="postal-code"
                autocomplete="postal-code"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                name="postal-code"
                type="text"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            Notifications
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            We'll always let you know about important changes, but you pick what
            else you want to hear about.
          </p>
        </div>

        <div class="max-w-2xl space-y-10 md:col-span-2">
          <fieldset>
            <legend class="text-sm font-semibold leading-6 text-gray-900">
              By Email
            </legend>
            <div class="mt-6 space-y-6">
              <div class="relative flex gap-x-3">
                <div class="flex h-6 items-center">
                  <input
                    id="comments"
                    class="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    name="comments"
                    type="checkbox"
                  />
                </div>
                <div class="text-sm leading-6">
                  <label class="font-medium text-gray-900" for="comments"
                    >Comments</label
                  >
                  <p class="text-gray-500">
                    Get notified when someones posts a comment on a posting.
                  </p>
                </div>
              </div>
              <div class="relative flex gap-x-3">
                <div class="flex h-6 items-center">
                  <input
                    id="candidates"
                    class="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    name="candidates"
                    type="checkbox"
                  />
                </div>
                <div class="text-sm leading-6">
                  <label class="font-medium text-gray-900" for="candidates"
                    >Candidates</label
                  >
                  <p class="text-gray-500">
                    Get notified when a candidate applies for a job.
                  </p>
                </div>
              </div>
              <div class="relative flex gap-x-3">
                <div class="flex h-6 items-center">
                  <input
                    id="offers"
                    class="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    name="offers"
                    type="checkbox"
                  />
                </div>
                <div class="text-sm leading-6">
                  <label class="font-medium text-gray-900" for="offers"
                    >Offers</label
                  >
                  <p class="text-gray-500">
                    Get notified when a candidate accepts or rejects an offer.
                  </p>
                </div>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend class="text-sm font-semibold leading-6 text-gray-900">
              Push Notifications
            </legend>
            <p class="mt-1 text-sm leading-6 text-gray-600">
              These are delivered via SMS to your mobile phone.
            </p>
            <div class="mt-6 space-y-6">
              <div class="flex items-center gap-x-3">
                <input
                  id="push-everything"
                  class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  name="push-notifications"
                  type="radio"
                />
                <label
                  class="block text-sm font-medium leading-6 text-gray-900"
                  for="push-everything"
                  >Everything</label
                >
              </div>
              <div class="flex items-center gap-x-3">
                <input
                  id="push-email"
                  class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  name="push-notifications"
                  type="radio"
                />
                <label
                  class="block text-sm font-medium leading-6 text-gray-900"
                  for="push-email"
                  >Same as email</label
                >
              </div>
              <div class="flex items-center gap-x-3">
                <input
                  id="push-nothing"
                  class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  name="push-notifications"
                  type="radio"
                />
                <label
                  class="block text-sm font-medium leading-6 text-gray-900"
                  for="push-nothing"
                  >No push notifications</label
                >
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-end gap-x-6">
      <button
        class="text-sm font-semibold leading-6 text-gray-900"
        type="button"
      >
        Cancel
      </button>
      <button
        class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        type="submit"
      >
        Save
      </button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { PhotoIcon, UserCircleIcon } from "@heroicons/vue/24/solid";
</script>
