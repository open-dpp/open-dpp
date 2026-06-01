import {
  type DigitalProductDocumentDto,
  type DigitalProductDocumentStatusModificationDto,
  DigitalProductDocumentStatusModificationMethodDto,
} from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { HTTPCode } from "../stores/http-codes.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useI18n } from "vue-i18n";
import { useConfirm } from "primevue/useconfirm";

import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";
import apiClient from "../lib/api-client.ts";

export function useDigitalProductDocument(type: DigitalProductDocumentTypeType) {
  const digitalProductDocNamespace =
    type === DigitalProductDocumentType.Passport
      ? apiClient.dpp.passports
      : apiClient.dpp.templates;
  const errorHandlingStore = useErrorHandlingStore();
  const prefix = type === DigitalProductDocumentType.Passport ? "passports" : "templates";
  const { t } = useI18n();
  const confirm = useConfirm();
  async function modifyStatus(id: string, data: DigitalProductDocumentStatusModificationDto) {
    const errorMessage = t(`${prefix}.errorModifyStatus`);
    try {
      const response = await digitalProductDocNamespace.modifyStatus(id, data);
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function fetchById(id: string): Promise<DigitalProductDocumentDto | null> {
    const errorMessage = t(`${prefix}.errorFetch`);
    try {
      const response = await digitalProductDocNamespace.getById(id);
      if (response.status !== HTTPCode.OK) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      return response.data;
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        return null;
      }
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
      throw e;
    }
  }

  async function publish(id: string) {
    await modifyStatus(id, { method: DigitalProductDocumentStatusModificationMethodDto.Publish });
  }

  async function archive(id: string) {
    await modifyStatus(id, { method: DigitalProductDocumentStatusModificationMethodDto.Archive });
  }

  async function restore(id: string) {
    await modifyStatus(id, { method: DigitalProductDocumentStatusModificationMethodDto.Restore });
  }

  async function deleteDPD(id: string, onDeleted: () => Promise<void>) {
    const errorMessage = t(`${prefix}.errorDelete`);
    const removeLabel = t("common.remove");
    const cancelLabel = t("common.cancel");

    confirm.require({
      message: t(`${prefix}.delete`),
      header: removeLabel,
      icon: "pi pi-info-circle",
      rejectLabel: cancelLabel,
      rejectProps: {
        label: cancelLabel,
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: removeLabel,
        severity: "danger",
      },
      accept: async () => {
        let deleted = false;
        try {
          const response = await digitalProductDocNamespace.deleteById(id);
          if (response.status === HTTPCode.NO_CONTENT) {
            deleted = true;
          } else {
            errorHandlingStore.logErrorWithNotification(errorMessage);
          }
        } catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
        if (deleted) {
          await onDeleted();
        }
      },
    });
  }

  return {
    fetchById,
    publish,
    archive,
    restore,
    deleteDPD,
  };
}
