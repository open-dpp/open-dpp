import type { BrandingDto, PassportDto } from "@open-dpp/dto";
import type { AxiosInstance } from "axios";
import type { UniqueProductIdentifierDto } from "./unique-product-identifiers.dtos";
import { AasNamespace } from "../aas/aasNamespace";

export class UniqueProductIdentifiersNamespace {
  public aas!: AasNamespace;

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "unique-product-identifiers");
  }

  public async getByReference(reference: string) {
    return this.axiosInstance.get<UniqueProductIdentifierDto[]>(
      `/unique-product-identifiers?reference=${reference}`,
    );
  }

  public async getPassport(uuid: string) {
    return this.axiosInstance.get<PassportDto>(`/unique-product-identifiers/${uuid}/passport`);
  }

  public async getBranding(uuid: string) {
    return await this.axiosInstance.get<BrandingDto>(
      `/unique-product-identifiers/${uuid}/branding`,
    );
  }
}
