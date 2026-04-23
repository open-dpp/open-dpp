import type { PresentationConfigurationNamespace } from "@open-dpp/api-client";
import type {
  KeyTypesType,
  PresentationComponentNameType,
  PresentationConfigurationDto,
  PresentationConfigurationPatchDto,
} from "@open-dpp/dto";
import { ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling";

export interface UsePresentationConfigOptions {
  id: string;
  namespace: PresentationConfigurationNamespace;
  errorHandlingStore: IErrorHandlingStore;
  translate: (key: string, ...args: unknown[]) => string;
}

export function usePresentationConfig(options: UsePresentationConfigOptions) {
  const config = ref<PresentationConfigurationDto | null>(null);
  const loading = ref(false);

  async function fetch() {
    loading.value = true;
    try {
      const response = await options.namespace.get(options.id);
      config.value = response.data;
    } catch (error) {
      options.errorHandlingStore.logErrorWithNotification(
        options.translate("presentation.loadPresentationConfigError"),
        error,
      );
      config.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function patch(data: PresentationConfigurationPatchDto) {
    const previous = config.value;
    try {
      const response = await options.namespace.patch(options.id, data);
      config.value = response.data;
      return response.data;
    } catch (error) {
      config.value = previous;
      options.errorHandlingStore.logErrorWithNotification(
        options.translate("presentation.updatePresentationConfigError"),
        error,
      );
      throw error;
    }
  }

  async function setElementDesign(path: string, component: PresentationComponentNameType) {
    return await patch({ elementDesign: { [path]: component } });
  }

  async function removeElementDesign(path: string) {
    return await patch({ elementDesign: { [path]: null } });
  }

  async function setDefaultComponent(type: KeyTypesType, component: PresentationComponentNameType) {
    return await patch({ defaultComponents: { [type]: component } });
  }

  async function removeDefaultComponent(type: KeyTypesType) {
    return await patch({ defaultComponents: { [type]: null } });
  }

  return {
    config,
    loading,
    fetch,
    patch,
    setElementDesign,
    removeElementDesign,
    setDefaultComponent,
    removeDefaultComponent,
  };
}
