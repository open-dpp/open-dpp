<template>
  <div v-if="draftStore.draft" class="flex flex-col gap-4 pt-5">
    <div class="flex-1 flex flex-col gap-4 transition-all duration-300">
      <div
        class="flex px-4 py-6 sm:px-6 justify-between items-center bg-white shadow-sm sm:rounded-lg"
      >
        <div>
          <h3 class="text-base/7 font-semibold text-gray-900">
            {{ t('draft.passportDraft') + ' ' + draftStore.draft.name }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
            {{ t('draft.version') + ' ' + draftStore.draft.version }}
          </p>
        </div>
        <div class="">
          <PublishDraftButton @on-publish="onPublish" />
        </div>
      </div>
    </div>
    <div v-if="draftStore.draft" class="grid grid-cols-1 gap-4">
      <div class="flex items-center">
        <div class="flex" v-if="!currentSections.isRootLevel">
          <BaseButton
            v-if="currentSections.parentSection"
            @click="navigateBackToParent"
            >{{ t('common.toHome') }}</BaseButton
          >
          <BaseButton
            v-if="currentSections.parentSection?.parentId"
            @click="navigateBackToParent"
            >{{
              t('common.backTo', { link: currentSections.parentSection.name })
            }}</BaseButton
          >
        </div>
        <AddSection
          :parent-granularity-level="
            currentSections.parentSection?.granularityLevel
          "
          :parent-id="currentSections.parentSection?.id"
        />
      </div>
      <div
        v-for="section of currentSections.subSections"
        :key="section.id"
        class="grid grid-cols-1 overflow-hidden bg-white shadow sm:rounded-lg w-full"
      >
        <BaseSectionHeader :section="section">
          <template #actions>
            <div class="flex px-2" :data-cy="`actions-section-${section.id}`">
              <BaseButton
                variant="primary"
                @click="onEditSectionClicked(section)"
              >
                {{ t('draft.edit') }}
              </BaseButton>
              <BaseButton
                variant="primary"
                @click="onAddDataFieldClicked(section)"
              >
                {{ t('draft.addDataField') }}
              </BaseButton>
              <BaseButton
                variant="primary"
                @click="onAddSubSectionClicked(section)"
              >
                {{ t('draft.addSection') }}
              </BaseButton>
              <div class="flex items-center rounded-md">
                <button
                  type="button"
                  :data-cy="`move-section-${section.id}-up`"
                  @click="draftStore.moveSectionUp(section.id)"
                  :disabled="isFirst(section.id)"
                  :aria-disabled="isFirst(section.id)"
                  class="inline-flex items-center justify-center rounded-l-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span class="sr-only">Abschnitt nach oben verschieben</span>
                  <ChevronUpIcon class="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  :data-cy="`move-section-${section.id}-down`"
                  @click="draftStore.moveSectionDown(section.id)"
                  :disabled="isLast(section.id)"
                  :aria-disabled="isLast(section.id)"
                  class="inline-flex items-center justify-center rounded-r-md bg-white px-1 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span class="sr-only">Abschnitt nach unten verschieben</span>
                  <ChevronDownIcon class="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </template>
        </BaseSectionHeader>
        <div class="p-4">
          <SectionDraft :section="section" />
        </div>
      </div>
    </div>
    <DraftSidebar />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDraftStore } from '../../stores/draft';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/20/solid';
import { SectionDto, VisibilityLevel } from '@open-dpp/api-client';
import PublishDraftButton from '../../components/template-drafts/PublishDraftButton.vue';
import { useNotificationStore } from '../../stores/notification';
import { useIndexStore } from '../../stores';
import DraftSidebar from '../../components/template-drafts/DraftSidebar.vue';
import BaseSectionHeader from '../../components/BaseSectionHeader.vue';
import BaseButton from '../../components/BaseButton.vue';
import {
  SidebarContentType,
  useDraftSidebarStore,
} from '../../stores/draftSidebar';
import AddSection from '../../components/template-drafts/AddSection.vue';
import SectionDraft from '../../components/template-drafts/SectionDraft.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const draftStore = useDraftStore();
const notificationStore = useNotificationStore();
const indexStore = useIndexStore();
const draftSidebarStore = useDraftSidebarStore();

const currentSections = computed(() => {
  const foundSection = route.query.sectionId
    ? draftStore.findSectionById(String(route.query.sectionId))
    : undefined;
  const currentSubSections =
    draftStore.draft?.sections.filter((s) => s.parentId === foundSection?.id) ??
    [];
  return {
    isRootLevel: !foundSection,
    parentSection: foundSection,
    subSections: currentSubSections,
  };
});

const onEditSectionClicked = (section: SectionDto) => {
  draftSidebarStore.open(SidebarContentType.SECTION_FORM, {
    type: section.type,
    id: section.id,
  });
};

const onAddDataFieldClicked = (section: SectionDto) => {
  draftSidebarStore.open(SidebarContentType.DATA_FIELD_SELECTION, {
    parentId: section.id,
    parentGranularityLevel: section.granularityLevel,
  });
};

const navigateBackToParent = () => {
  router.push(`?sectionId=${currentSections.value.parentSection?.parentId}`);
};

const onAddSubSectionClicked = (section: SectionDto) => {
  router.push(`?sectionId=${section.id}`);
};

const fetchData = async () => {
  await draftStore.fetchDraft(String(route.params.draftId));
};

const isFirst = (id: string) =>
  currentSections.value.subSections.findIndex((s) => s.id === id) === 0;

const isLast = (id: string) => {
  const idx = currentSections.value.subSections.findIndex((s) => s.id === id);
  return idx === currentSections.value.subSections.length - 1;
};

const onPublish = async (visibility: VisibilityLevel) => {
  await draftStore.publish({ visibility });
  notificationStore.addSuccessNotification(
    t('draft.createPassTemplateSuccess'),
    {
      label: t('draft.createModel'),
      to: `/organizations/${indexStore.selectedOrganization}/models/create`,
    },
  );
};

onMounted(async () => {
  await fetchData();
});
</script>
