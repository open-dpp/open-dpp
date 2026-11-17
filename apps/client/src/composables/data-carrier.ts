import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportFormat,
  type CarrierExportFormatType,
  formatGs1ElementString,
  PermalinkKind,
  type PermalinkKindType,
} from "@open-dpp/dto";
import {
  computed,
  type MaybeRefOrGetter,
  onScopeDispose,
  readonly,
  ref,
  toValue,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { downloadBlob, fileNameFromContentDisposition } from "../lib/download.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useNotificationStore } from "../stores/notification.ts";

export interface DataCarrierPermalink {
  id: string;
  kind: PermalinkKindType;
  publicUrl: string;
}

export interface DataCarrierIdentity {
  gtin: string;
  batch?: string | null;
  serial?: string | null;
}

function toElementString(identity: DataCarrierIdentity | null | undefined): string | undefined {
  if (!identity?.gtin) return undefined;
  const { gtin, batch, serial } = identity;
  try {
    return formatGs1ElementString({ gtin, batch, serial });
  } catch (error) {
    console.error("Cannot format the GS1 element string", error);
    return undefined;
  }
}

/**
 * Shows the permalink's Data Carrier, drawn from its Carrier Export at the default settings,
 * and lets the user download the Carrier Export or copy the URL it encodes.
 * Failures are reported as notifications.
 */
export function useDataCarrier(
  permalink: MaybeRefOrGetter<DataCarrierPermalink>,
  identity: MaybeRefOrGetter<DataCarrierIdentity | null | undefined> = null,
) {
  const { t } = useI18n();
  const notificationStore = useNotificationStore();
  const { logErrorWithNotification } = useErrorHandlingStore();

  const imageUrl = ref<string | null>(null);
  const loadFailed = ref(false);
  const downloading = ref<CarrierExportFormatType | null>(null);
  let latestLoad = 0;

  const isGs1Link = computed(() => toValue(permalink).kind === PermalinkKind.GS1_LINK);
  const url = computed(() => toValue(permalink).publicUrl);
  const urlLabel = computed(() =>
    isGs1Link.value ? t("dataCarrier.digitalLink.label") : t("permalink.list.publicUrl"),
  );
  const elementString = computed(() =>
    isGs1Link.value ? toElementString(toValue(identity)) : undefined,
  );

  function releaseImage() {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
      imageUrl.value = null;
    }
  }

  async function showDataCarrier(permalinkId: string) {
    const load = ++latestLoad;
    // The old carrier encodes the old URL; never show it next to the new one
    releaseImage();
    loadFailed.value = false;
    try {
      const response = await apiClient.dpp.permalinks.getCarrierExport(permalinkId, {
        format: CarrierExportFormat.SVG,
      });
      if (load !== latestLoad) return;
      releaseImage();
      imageUrl.value = URL.createObjectURL(
        new Blob([response.data], { type: CARRIER_EXPORT_CONTENT_TYPES[CarrierExportFormat.SVG] }),
      );
    } catch (error) {
      if (load !== latestLoad) return;
      releaseImage();
      loadFailed.value = true;
      logErrorWithNotification(t("dataCarrier.loadError"), error);
    }
  }

  // One source per field: a getter returning a fresh array would reload on every new object
  watch(
    [() => toValue(permalink).id, () => toValue(permalink).publicUrl],
    ([permalinkId]) => showDataCarrier(permalinkId),
    { immediate: true },
  );

  onScopeDispose(() => {
    // A load still in flight must not create an object URL nobody releases
    latestLoad++;
    releaseImage();
  });

  async function download(format: CarrierExportFormatType) {
    downloading.value = format;
    try {
      const response = await apiClient.dpp.permalinks.getCarrierExport(toValue(permalink).id, {
        format,
      });
      downloadBlob(
        response.data,
        fileNameFromContentDisposition(response.headers["content-disposition"]) ??
          `data-carrier.${format}`,
      );
    } catch (error) {
      logErrorWithNotification(t("dataCarrier.downloadError"), error);
    } finally {
      downloading.value = null;
    }
  }

  async function copyUrl() {
    if (!url.value) return;
    try {
      // Throws when the Clipboard API is missing and rejects when the write is denied
      await navigator.clipboard.writeText(url.value);
      notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
    } catch (error) {
      logErrorWithNotification(t("dataCarrier.copyError"), error);
    }
  }

  return {
    imageUrl: readonly(imageUrl),
    loadFailed: readonly(loadFailed),
    downloading: readonly(downloading),
    url,
    urlLabel,
    elementString,
    download,
    copyUrl,
  };
}
