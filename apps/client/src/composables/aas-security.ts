import type {
  AccessPermissionRuleResponseDto,
  SecurityResponseDto,
} from "@open-dpp/dto";
import { ref } from "vue";

export interface AasSecurityProps {
}

export interface IAasSecurity {
  setAasSecurity: (security: SecurityResponseDto[]) => void;
}

export function useAasSecurity() {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>([]);

  function setAasSecurity(security: SecurityResponseDto[]) {
  }

  return { setAasSecurity };
}
