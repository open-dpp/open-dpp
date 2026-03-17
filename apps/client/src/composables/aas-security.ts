import type { AasNamespace } from "@open-dpp/api-client";
import type {
  AccessPermissionRuleResponseDto,
} from "@open-dpp/dto";
import { ref } from "vue";
import { HTTPCode } from "../stores/http-codes.ts";

export interface AasSecurityProps {
  id: string;
  aasNamespace: AasNamespace;
}

export interface IAasSecurity {
}

export function useAasSecurity({ aasNamespace, id }: AasSecurityProps) {
  const accessPermissionRules = ref<AccessPermissionRuleResponseDto[]>([]);
  const fetchRules = async () => {
    const response = await aasNamespace.getSecurity(id);
    if (response.status === HTTPCode.OK) {
      accessPermissionRules.value = response.data;
    }
  };

  async function init() {
    await fetchRules();
  }

  return { init, accessPermissionRules };
}
