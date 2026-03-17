import type { AxiosInstance } from 'axios'
import type {
  AasConnectionDto,
  AasConnectionGetAllDto,
  AasPropertyWithParentDto,
  AssetAdministrationShellType,
  CreateAasConnectionDto,
  UpdateAasConnectionDto,
} from './aas-integration.dtos'

export class AasIntegrationNamespace {
  private readonly aasBaseEndpoint = `/integration/aas`
  private readonly aasConnectionsEndpoint = `${this.aasBaseEndpoint}/connections`
  constructor(
    private readonly axiosInstance: AxiosInstance,
  ) {}

  public async getConnection(connectionId: string) {
    return this.axiosInstance.get<AasConnectionDto>(
      `${this.aasConnectionsEndpoint}/${connectionId}`,
    )
  }

  public async getAllConnections() {
    return this.axiosInstance.get<AasConnectionGetAllDto[]>(
      this.aasConnectionsEndpoint,
    )
  }

  public async createConnection(data: CreateAasConnectionDto) {
    return this.axiosInstance.post<AasConnectionDto>(
      this.aasConnectionsEndpoint,
      data,
    )
  }

  public async modifyConnection(
    connectionId: string,
    data: UpdateAasConnectionDto,
  ) {
    return this.axiosInstance.patch<AasConnectionDto>(
      `${this.aasConnectionsEndpoint}/${connectionId}`,
      data,
    )
  }

  public async getPropertiesOfAas(aasType: AssetAdministrationShellType) {
    return this.axiosInstance.get<AasPropertyWithParentDto[]>(
      `${this.aasBaseEndpoint}/${aasType}/properties`,
    )
  }
}
