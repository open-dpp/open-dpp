import type {
  AssetAdministrationShellResponseDto,
  PassportDto,
  PresentationConfigurationDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";

import { isAxiosError } from "axios";

export class PassportNotFoundError extends Error {}

export class PassportLoadError extends Error {
  constructor(
    readonly translationKey: string,
    cause?: unknown,
  ) {
    super(translationKey, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}

export const usePassportStore = defineStore("passport", () => {
  const productPassport = ref<PassportDto>();
  const submodels = ref<SubmodelResponseDto[]>([]);
  const shells = ref<AssetAdministrationShellResponseDto[]>();
  const presentationConfig = ref<PresentationConfigurationDto | null>(null);
  /**
   * The permalink (id or slug) the passport was loaded through. Public media is fetched through
   * it, so access to a passport's files ends together with the permalink. Empty outside the
   * public page.
   */
  const permalinkIdOrSlug = ref<string>("");

  /** Forget the permalink when leaving the public page, so other views fetch media by bare id. */
  function clearPermalink(): void {
    permalinkIdOrSlug.value = "";
  }

  async function loadPassport(id: string): Promise<void> {
    permalinkIdOrSlug.value = id;
    try {
      const response = await apiClient.dpp.permalinks.getById(id);
      productPassport.value = response.data.passport;
      presentationConfig.value = response.data.presentationConfiguration;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new PassportNotFoundError(id);
      }
      throw new PassportLoadError("presentation.loadPassportError", error);
    }

    try {
      const submodelsResponse = await apiClient.dpp.permalinks.aas.getSubmodels(id, {});
      submodels.value = submodelsResponse.data.result || [];
    } catch (error) {
      throw new PassportLoadError("presentation.loadSubmodelsError", error);
    }

    try {
      const aasResponse = await apiClient.dpp.permalinks.aas.getShells(id, {});
      shells.value = aasResponse.data.result || [];
    } catch (error) {
      throw new PassportLoadError("presentation.loadShellsError", error);
    }
  }

  return {
    productPassport,
    submodels,
    shells,
    presentationConfig,
    permalinkIdOrSlug,
    loadPassport,
    clearPermalink,
  };
});
