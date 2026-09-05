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

  /**
   * Sequence number of the most recent loadPassport call. A call only writes to the store while it
   * still holds the latest number, so a slow response for a previous permalink can never overwrite
   * the passport, config, submodels or shells of the permalink that is current now, whose media is
   * fetched through permalinkIdOrSlug.
   */
  let latestLoadSequence = 0;

  /**
   * Load the passport behind a permalink. If a newer loadPassport call starts before this one
   * finishes, this one stops without touching the store and resolves without an error: only the
   * latest call reports its outcome.
   */
  async function loadPassport(id: string): Promise<void> {
    const sequence = ++latestLoadSequence;
    const isCurrentLoad = () => sequence === latestLoadSequence;
    permalinkIdOrSlug.value = id;
    try {
      await loadPassportData(id, isCurrentLoad);
    } catch (error) {
      if (isCurrentLoad()) throw error;
    }
  }

  async function loadPassportData(id: string, isCurrentLoad: () => boolean): Promise<void> {
    try {
      const response = await apiClient.dpp.permalinks.getById(id);
      if (!isCurrentLoad()) return;
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
      if (!isCurrentLoad()) return;
      submodels.value = submodelsResponse.data.result || [];
    } catch (error) {
      throw new PassportLoadError("presentation.loadSubmodelsError", error);
    }

    try {
      const aasResponse = await apiClient.dpp.permalinks.aas.getShells(id, {});
      if (!isCurrentLoad()) return;
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
