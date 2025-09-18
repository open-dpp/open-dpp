<template>
  <div class="flow-root">
    <ul class="-mb-8" role="list">
      <li
        v-for="(activityItem, activityItemIdx) in activity"
        :key="activityItem.id"
      >
        <div class="relative pb-8">
          <span
            v-if="activityItemIdx !== activity.length - 1"
            aria-hidden="true"
            class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
          />
          <div class="relative flex items-start space-x-3">
            <template v-if="activityItem.type === 'comment'">
              <div class="relative">
                <img
                  :src="activityItem.imageUrl"
                  alt=""
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white"
                />

                <span
                  class="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px"
                >
                  <ChatBubbleLeftEllipsisIcon
                    aria-hidden="true"
                    class="h-5 w-5 text-gray-400"
                  />
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div>
                  <div class="text-sm">
                    <a
                      :href="activityItem.person.href"
                      class="font-medium text-gray-900"
                      >{{ activityItem.person.name }}</a
                    >
                  </div>
                  <p class="mt-0.5 text-sm text-gray-500">
                    Commented {{ activityItem.date }}
                  </p>
                </div>
                <div class="mt-2 text-sm text-gray-700">
                  <p>{{ activityItem.comment }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="activityItem.type === 'assignment'">
              <div>
                <div class="relative px-1">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white"
                  >
                    <UserCircleIcon
                      aria-hidden="true"
                      class="h-5 w-5 text-gray-500"
                    />
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-1.5">
                <div class="text-sm text-gray-500">
                  <a
                    :href="activityItem.person.href"
                    class="font-medium text-gray-900"
                    >{{ activityItem.person.name }}</a
                  >
                  {{ ' ' }}
                  assigned
                  {{ ' ' }}
                  <a
                    :href="activityItem.assigned?.href"
                    class="font-medium text-gray-900"
                    >{{ activityItem.assigned?.name }}</a
                  >
                  {{ ' ' }}
                  <span class="whitespace-nowrap">{{ activityItem.date }}</span>
                </div>
              </div>
            </template>
            <template v-else-if="activityItem.type === 'tags'">
              <div>
                <div class="relative px-1">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white"
                  >
                    <TagIcon aria-hidden="true" class="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-sm leading-8 text-gray-500">
                  <span class="mr-0.5">
                    <a
                      :href="activityItem.person.href"
                      class="font-medium text-gray-900"
                      >{{ activityItem.person.name }}</a
                    >
                    {{ ' ' }}
                    added tags
                  </span>
                  {{ ' ' }}
                  <span class="mr-0.5">
                    <template v-for="tag in activityItem.tags" :key="tag.name">
                      <a
                        :href="tag.href"
                        class="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200"
                      >
                        <svg
                          :class="[tag.color, 'h-1.5 w-1.5']"
                          aria-hidden="true"
                          viewBox="0 0 6 6"
                        >
                          <circle cx="3" cy="3" r="3" />
                        </svg>
                        {{ tag.name }}
                      </a>
                      {{ ' ' }}
                    </template>
                  </span>
                  <span class="whitespace-nowrap">{{ activityItem.date }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  UserCircleIcon,
} from '@heroicons/vue/20/solid';

const activity = [
  {
    id: 1,
    type: 'comment',
    person: { name: 'Eduardo Benz', href: '#' },
    imageUrl:
      'https://images.unsplash.com/photo-1520785643438-5bf77931f493?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
    comment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius. Et diam cursus quis sed purus nam. ',
    date: '6d ago',
  },
  {
    id: 2,
    type: 'assignment',
    person: { name: 'Hilary Mahy', href: '#' },
    assigned: { name: 'Kristin Watson', href: '#' },
    date: '2d ago',
  },
  {
    id: 3,
    type: 'tags',
    person: { name: 'Hilary Mahy', href: '#' },
    tags: [
      { name: 'Bug', href: '#', color: 'fill-red-500' },
      { name: 'Accessibility', href: '#', color: 'fill-indigo-500' },
    ],
    date: '6h ago',
  },
  {
    id: 4,
    type: 'comment',
    person: { name: 'Jason Meyers', href: '#' },
    imageUrl:
      'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
    comment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tincidunt nunc ipsum tempor purus vitae id. Morbi in vestibulum nec varius. Et diam cursus quis sed purus nam. Scelerisque amet elit non sit ut tincidunt condimentum. Nisl ultrices eu venenatis diam.',
    date: '2h ago',
  },
];
</script>
