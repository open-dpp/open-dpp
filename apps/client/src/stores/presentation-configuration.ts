import type { PresentationConfigurationNamespace } from "@open-dpp/api-client";
import type { PresentationComponentNameType, PresentationConfigurationDto } from "@open-dpp/dto";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { IErrorHandlingStore } from "./error.handling";

export interface FetchOptions {
  referenceId: string;
  namespace: PresentationConfigurationNamespace;
  errorHandlingStore: IErrorHandlingStore;
  translate: (key: string, ...args: unknown[]) => string;
}

export const usePresentationConfigurationStore = defineStore("presentation-configuration", () => {
  const configs = ref<PresentationConfigurationDto[]>([]);
  const loading = ref(false);
  const activeConfigId = ref<string | null>(null);
  const referenceId = ref<string | null>(null);
  let namespace: PresentationConfigurationNamespace | null = null;
  let errorStore: IErrorHandlingStore | null = null;
  let translateFn: ((key: string, ...args: unknown[]) => string) | null = null;

  const activeConfig = computed<PresentationConfigurationDto | null>(() => {
    if (configs.value.length === 0) return null;
    if (activeConfigId.value) {
      const found = configs.value.find((c) => c.id === activeConfigId.value);
      if (found) return found;
    }
    return configs.value[0] ?? null;
  });

  function setActiveConfigId(id: string | null) {
    activeConfigId.value = id;
  }

  async function fetch(options: FetchOptions) {
    loading.value = true;
    namespace = options.namespace;
    errorStore = options.errorHandlingStore;
    translateFn = options.translate;
    referenceId.value = options.referenceId;
    try {
      const response = await options.namespace.list(options.referenceId);
      configs.value = response.data;
    } catch (error) {
      options.errorHandlingStore.logErrorWithNotification(
        options.translate("presentation.loadPresentationConfigError"),
        error,
      );
      configs.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function setElementDesign(path: string, component: PresentationComponentNameType) {
    await patchActive({ elementDesign: { [path]: component } });
  }

  async function removeElementDesign(path: string) {
    await patchActive({ elementDesign: { [path]: null } });
  }

  async function patchActive(body: {
    elementDesign?: Record<string, PresentationComponentNameType | null>;
  }) {
    if (!namespace || !errorStore || !translateFn || !referenceId.value) return;
    const target = activeConfig.value;
    if (!target) return;
    const previous = configs.value;
    try {
      const response = await namespace.patchById(referenceId.value, target.id, body);
      configs.value = configs.value.map((c) => (c.id === response.data.id ? response.data : c));
    } catch (error) {
      configs.value = previous;
      errorStore.logErrorWithNotification(
        translateFn("presentation.updatePresentationConfigError"),
        error,
      );
      throw error;
    }
  }

  function $reset() {
    configs.value = [];
    activeConfigId.value = null;
    referenceId.value = null;
    loading.value = false;
    namespace = null;
    errorStore = null;
    translateFn = null;
  }

  return {
    configs,
    loading,
    activeConfigId,
    activeConfig,
    setActiveConfigId,
    fetch,
    setElementDesign,
    removeElementDesign,
    $reset,
  };
});
