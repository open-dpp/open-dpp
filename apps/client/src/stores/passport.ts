import type { AssetAdministrationShellDto, PassportDto, SubmodelResponseDto } from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";

export const usePassportStore = defineStore("passport", () => {
  const productPassport = ref<PassportDto>();
  const submodels = ref<SubmodelResponseDto[]>([]);
  const shells = ref<AssetAdministrationShellDto[]>();


  return {
    productPassport,
    submodels,
    shells,
  };
});
