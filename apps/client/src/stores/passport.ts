import type {
  AssetAdministrationShellResponseDto,
  PassportDto,
  PresentationConfigurationDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";

export const usePassportStore = defineStore("passport", () => {
  const productPassport = ref<PassportDto>();
  const submodels = ref<SubmodelResponseDto[]>([]);
  const shells = ref<AssetAdministrationShellResponseDto[]>();
  const presentationConfig = ref<PresentationConfigurationDto | null>(null);

  return {
    productPassport,
    submodels,
    shells,
    presentationConfig,
  };
});
