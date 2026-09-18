<script setup lang="ts">
import {
  DigitalProductDocumentStatusDto,
  PassportEditingModeDto,
  type DigitalProductDocumentDto,
} from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { useDigitalProductDocumentToolbar } from "../../composables/digital-product-document-toolbar.ts";
import { useRouterUtils } from "../../composables/router-utils.ts";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();

const model = defineModel<DigitalProductDocumentDto>({ required: true });

const props = defineProps<{
  type: DigitalProductDocumentTypeType;
}>();
const { goToParent } = useRouterUtils();
const { publish, archive, restore, deleteDPD, fetchById } = useDigitalProductDocument(props.type);
const route = useRoute();
const router = useRouter();

async function fetchDPD(id: string) {
  try {
    const data = await fetchById(id);
    if (data) {
      model.value = data;
    }
  } catch {}
}

const qrCodeDialogVisible = ref<boolean>(false);

async function onDeleteButtonClicked(item: DigitalProductDocumentDto) {
  await deleteDPD(item.id, async () => {
    await goToParent();
  });
}

async function onArchiveButtonClicked(item: DigitalProductDocumentDto) {
  await archive(item.id);
  await fetchDPD(item.id);
}

async function onRestoreButtonClicked(item: DigitalProductDocumentDto) {
  await restore(item.id);
  await fetchDPD(item.id);
}

async function onPublishButtonClicked(item: DigitalProductDocumentDto) {
  await publish(item.id);
  await fetchDPD(item.id);
}

const {
  passportEditingMode,
  editingMode,
  onRestrictPassportEditingButtonClicked,
  onRemoveEditingRestrictionsButtonClicked,
} = useDigitalProductDocumentToolbar(props.type, model, fetchDPD);

async function navigateToActivityHistory() {
  await router.push(`${route.path}/activities`);
}

async function navigateTo(routeName: string, passportId: string) {
  await router.push({
    name: routeName,
    params: { organizationId: route.params.organizationId, passportId },
  });
}

const status = computed(() => model.value?.lastStatusChange.currentStatus);

const permalinkActions = computed(() => [
  {
    label: t("permalink.list.label", 2),
    icon: "pi pi-link",
    command: () => {
      if (model.value?.id) {
        navigateTo("passportPermalinks", model.value.id);
      }
    },
  },
  {
    label: t("uniqueProductIdentifiers.label", 2),
    icon: "pi pi-barcode",
    command: () => {
      if (model.value?.id) {
        navigateTo("passportUniqueProductIdentifiers", model.value.id);
      }
    },
  },
]);
</script>

<template>
  <div class="card">
    <Toolbar v-if="status && model">
      <template #start>
        <div class="flex gap-2">
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-trash"
            severity="danger"
            text
            :aria-label="t('common.remove')"
            v-tooltip.bottom="t('common.remove')"
            @click="onDeleteButtonClicked(model)"
          />
          <Button
            v-if="
              status === DigitalProductDocumentStatusDto.Draft ||
              status === DigitalProductDocumentStatusDto.Published
            "
            icon="pi pi-folder-open"
            severity="secondary"
            text
            :aria-label="t('status.archive')"
            v-tooltip.bottom="t('status.archive')"
            @click="onArchiveButtonClicked(model)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Archived"
            icon="pi pi-undo"
            severity="secondary"
            text
            :aria-label="t('status.restore')"
            v-tooltip.bottom="t('status.restore')"
            @click="onRestoreButtonClicked(model)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-megaphone"
            text
            severity="secondary"
            :aria-label="t('status.publish')"
            v-tooltip.bottom="t('status.publish')"
            @click="onPublishButtonClicked(model)"
          />
          <Button
            icon="pi pi-history"
            text
            severity="secondary"
            :aria-label="t('activityHistory.label')"
            v-tooltip.bottom="t('activityHistory.label')"
            @click="navigateToActivityHistory"
          />
          <Button
            v-if="
              type === DigitalProductDocumentType.Template &&
              passportEditingMode === PassportEditingModeDto.Full
            "
            icon="pi pi-lock"
            text
            severity="secondary"
            :aria-label="t('templates.restrictPassportEditing')"
            v-tooltip.bottom="t('templates.restrictPassportEditingTooltip')"
            @click="onRestrictPassportEditingButtonClicked(model)"
          />
          <Button
            v-if="
              type === DigitalProductDocumentType.Passport &&
              editingMode === PassportEditingModeDto.DataOnly
            "
            icon="pi pi-lock-open"
            text
            severity="secondary"
            :aria-label="t('passports.removeEditingRestrictions')"
            v-tooltip.bottom="t('passports.removeEditingRestrictionsTooltip')"
            @click="onRemoveEditingRestrictionsButtonClicked(model)"
          />
        </div>
      </template>
      <template #center>
        <div v-if="type === DigitalProductDocumentType.Passport" class="flex items-center gap-2">
          <Tag severity="contrast">{{ t(`status.${status.toLowerCase()}`) }}</Tag>
          <Tag
            v-if="editingMode === PassportEditingModeDto.DataOnly"
            v-tooltip.bottom="t('passports.removeEditingRestrictionsTooltip')"
            severity="warn"
            icon="pi pi-lock"
            >{{ t("passports.restrictedEditingTag") }}</Tag
          >
        </div>
      </template>
      <template #end>
        <div class="flex items-center gap-2">
          <SplitButton
            v-if="type === DigitalProductDocumentType.Passport"
            icon="pi pi-qrcode"
            severity="primary"
            :label="t('common.qrCode')"
            :model="permalinkActions"
            @click="qrCodeDialogVisible = true"
          />
          <template v-if="type === DigitalProductDocumentType.Template">
            <Tag
              v-if="passportEditingMode === PassportEditingModeDto.DataOnly"
              v-tooltip.bottom="t('templates.restrictPassportEditingTooltip')"
              severity="warn"
              icon="pi pi-lock"
              >{{ t("templates.restrictPassportEditingTag") }}</Tag
            >
            <Tag severity="contrast">{{ t(`status.${status.toLowerCase()}`) }}</Tag>
          </template>
        </div>
      </template>
    </Toolbar>
  </div>
  <PassportQrCodeDialog
    v-if="type === DigitalProductDocumentType.Passport && model"
    v-model:visible="qrCodeDialogVisible"
    :passportId="model.id"
    :status="status"
    @publish="onPublishButtonClicked(model)"
  />
</template>
