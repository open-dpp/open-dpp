import type { PolicyUtilizationDtoType, SetPolicyLimitsDto } from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class PoliciesNamespace {
  private readonly policiesEndpoint = "/policies";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async get(organizationId: string) {
    return await this.axiosInstance.get<PolicyUtilizationDtoType>(
      `${this.policiesEndpoint}/organizations/${organizationId}`,
    );
  }

  public async setLimits(organizationId: string, limits: SetPolicyLimitsDto) {
    return await this.axiosInstance.patch<PolicyUtilizationDtoType>(
      `${this.policiesEndpoint}/organizations/${organizationId}/limits`,
      limits,
    );
  }
}
