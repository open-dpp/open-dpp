import type {
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  MoveSubmodelDto,
  MoveSubmodelElementDto,
  PagingParamsDto,
  ReorderColumnDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  TableModificationParamsDto,
  ValueRequestDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

/**
 * Namespace for Asset Administration Shell (AAS) operations.
 * Provides methods for managing shells, submodels, submodel elements, and their values.
 */
export class AasNamespace {
  private readonly aasEndpoint;

  constructor(
    private readonly axiosInstance: AxiosInstance,
    readonly basePath: string,
  ) {
    this.aasEndpoint = `/${basePath}`;
  }

  /**
   * Retrieves a paginated list of Asset Administration Shells.
   * @param id - The identifier of the resource
   * @param params - Pagination parameters
   * @returns A promise resolving to a paginated response of Asset Administration Shells
   */
  public async getShells(id: string, params: PagingParamsDto) {
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(
      `${this.aasEndpoint}/${id}/shells`,
      { params },
    );
  }

  /**
   * Modifies an existing Asset Administration Shell.
   * @param id - The identifier of the resource
   * @param aasId - The identifier of the Asset Administration Shell
   * @param data - The modification data for the shell
   * @returns A promise resolving to the modified Asset Administration Shell
   */
  public async modifyShell(
    id: string,
    aasId: string,
    data: AssetAdministrationShellModificationDto,
  ) {
    return this.axiosInstance.patch<AssetAdministrationShellResponseDto>(
      `${this.aasEndpoint}/${id}/shells/${aasId}`,
      data,
    );
  }

  /**
   * Retrieves a paginated list of Submodels.
   * @param id - The identifier of the resource
   * @param params - Pagination parameters
   * @returns A promise resolving to a paginated response of Submodels
   */
  public async getSubmodels(id: string, params: PagingParamsDto) {
    return this.axiosInstance.get<SubmodelPaginationResponseDto>(
      `${this.aasEndpoint}/${id}/submodels`,
      { params },
    );
  }

  /**
   * Retrieves a specific Submodel by its identifier.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @returns A promise resolving to the Submodel
   */
  public async getSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.get<AssetAdministrationShellPaginationResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}`,
    );
  }

  /**
   * Deletes a security policy by subject and object.
   * @param id - The identifier of the resource
   * @param data - The policy deletion data containing subject and object information
   * @returns A promise resolving when the policy is deleted
   */
  public async deletePolicyBySubjectAndObject(id: string, data: DeletePolicyDto) {
    return this.axiosInstance.delete(`${this.aasEndpoint}/${id}/security/policies`, { data });
  }

  /**
   * Deletes a Submodel by its identifier.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel to delete
   * @returns A promise resolving when the Submodel is deleted
   */
  public async deleteSubmodelById(id: string, submodelId: string) {
    return this.axiosInstance.delete(`${this.aasEndpoint}/${id}/submodels/${submodelId}`);
  }

  /**
   * Retrieves the value of a Submodel.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @returns A promise resolving to the Submodel value
   */
  public async getSubmodelValue(
    id: string,
    submodelId: string,
  ): Promise<AxiosResponse<ValueResponseDto>> {
    return this.axiosInstance.get<ValueResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/$value`,
    );
  }

  /**
   * Retrieves a paginated list of Submodel Elements.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @returns A promise resolving to a paginated response of Submodel Elements
   */
  public async getSubmodelElements(id: string, submodelId: string) {
    return this.axiosInstance.get<SubmodelElementPaginationResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`,
    );
  }

  /**
   * Retrieves the value of a specific Submodel Element.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element
   * @returns A promise resolving to the Submodel Element value
   */
  public async getSubmodelElementValue(
    id: string,
    submodelId: string,
    idShortPath: string,
  ): Promise<AxiosResponse<ValueResponseDto>> {
    return this.axiosInstance.get<ValueResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/$value`,
    );
  }

  /**
   * Retrieves a specific Submodel Element by its idShort path.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element
   * @returns A promise resolving to the Submodel Element
   */
  public async getSubmodelElementById(id: string, submodelId: string, idShortPath: string) {
    return this.axiosInstance.get<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`,
    );
  }

  /**
   * Deletes a Submodel Element by its idShort path.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element to delete
   * @returns A promise resolving when the Submodel Element is deleted
   */
  public async deleteSubmodelElementById(id: string, submodelId: string, idShortPath: string) {
    return this.axiosInstance.delete(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`,
    );
  }

  /**
   * Creates a new Submodel.
   * @param id - The identifier of the resource
   * @param data - The Submodel creation data
   * @returns A promise resolving to the created Submodel
   */
  public async createSubmodel(id: string, data: SubmodelRequestDto) {
    return this.axiosInstance.post<SubmodelResponseDto>(
      `${this.aasEndpoint}/${id}/submodels`,
      data,
    );
  }

  /**
   * Modifies an existing Submodel.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param data - The modification data for the Submodel
   * @returns A promise resolving to the modified Submodel
   */
  public async modifySubmodel(id: string, submodelId: string, data: SubmodelModificationDto) {
    return this.axiosInstance.patch<SubmodelResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}`,
      data,
    );
  }

  /**
   * Moves a Submodel to a new position among its siblings.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel to move
   * @param data - The new position
   * @returns A promise resolving to the moved Submodel
   */
  public async moveSubmodel(id: string, submodelId: string, data: MoveSubmodelDto) {
    return this.axiosInstance.post<SubmodelResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/move`,
      data,
    );
  }

  /**
   * Modifies the value of a Submodel.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param data - The new value data
   * @returns A promise resolving to the updated Submodel
   */
  public async modifyValueOfSubmodel(id: string, submodelId: string, data: ValueRequestDto) {
    return this.axiosInstance.patch<SubmodelResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/$value`,
      data,
    );
  }

  /**
   * Creates a new Submodel Element.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param data - The Submodel Element creation data
   * @returns A promise resolving to the created Submodel Element
   */
  public async createSubmodelElement(
    id: string,
    submodelId: string,
    data: SubmodelElementRequestDto,
  ) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements`,
      data,
    );
  }

  /**
   * Creates a new Submodel Element at a specific idShort path.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path where the element should be created
   * @param data - The Submodel Element creation data
   * @returns A promise resolving to the created Submodel Element
   */
  public async createSubmodelElementAtIdShortPath(
    id: string,
    submodelId: string,
    idShortPath: string,
    data: SubmodelElementRequestDto,
  ) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`,
      data,
    );
  }

  /**
   * Moves or reorders a Submodel Element within its Submodel — either to a new
   * position under its current parent, or to a different parent entirely.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element to move
   * @param data - The move target (position and/or new parent idShort path)
   * @returns A promise resolving to the moved Submodel Element
   */
  public async moveSubmodelElement(
    id: string,
    submodelId: string,
    idShortPath: string,
    data: MoveSubmodelElementDto,
  ) {
    return this.axiosInstance.post<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/move`,
      data,
    );
  }

  /**
   * Adds a column to a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param data - The column data
   * @param params - Table modification parameters
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async addColumnToSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    data: SubmodelElementRequestDto,
    params: TableModificationParamsDto,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns`,
      data,
      { params },
    );
  }

  /**
   * Modifies a column in a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param idShortOfColumn - The idShort of the column to modify
   * @param data - The modification data for the column
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async modifyColumnOfSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    idShortOfColumn: string,
    data: SubmodelElementModificationDto,
  ) {
    return this.axiosInstance.patch<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns/${idShortOfColumn}`,
      data,
    );
  }

  /**
   * Deletes a column from a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param idShortOfColumn - The idShort of the column to delete
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async deleteColumnFromSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    idShortOfColumn: string,
  ) {
    return this.axiosInstance.delete<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns/${idShortOfColumn}`,
    );
  }

  /**
   * Adds a column to a group within a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param groupIdShort - The idShort of the group
   * @param data - The column data
   * @param params - Table modification parameters
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async addColumnToGroupInSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    groupIdShort: string,
    data: SubmodelElementRequestDto,
    params: TableModificationParamsDto,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/groups/${groupIdShort}/columns`,
      data,
      { params },
    );
  }

  /**
   * Modifies a column within a group in a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param groupIdShort - The idShort of the group
   * @param idShortOfColumn - The idShort of the column to modify
   * @param data - The modification data for the column
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async modifyColumnInGroupOfSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    groupIdShort: string,
    idShortOfColumn: string,
    data: SubmodelElementModificationDto,
  ) {
    return this.axiosInstance.patch<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/groups/${groupIdShort}/columns/${idShortOfColumn}`,
      data,
    );
  }

  /**
   * Deletes a column from a group within a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param groupIdShort - The idShort of the group
   * @param idShortOfColumn - The idShort of the column to delete
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async deleteColumnFromGroupInSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    groupIdShort: string,
    idShortOfColumn: string,
  ) {
    return this.axiosInstance.delete<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/groups/${groupIdShort}/columns/${idShortOfColumn}`,
    );
  }

  /**
   * Moves a column to a group within a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param groupIdShort - The idShort of the target group
   * @param idShortOfColumn - The idShort of the column to move
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async moveColumnToGroupInSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    groupIdShort: string,
    idShortOfColumn: string,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/groups/${groupIdShort}/columns/${idShortOfColumn}/move`,
      undefined,
    );
  }

  /**
   * Reorders a column within its current container (the table's top level, or a
   * group within it) — does not change which group the column lives in.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param idShortOfColumn - The idShort of the column to reorder
   * @param data - The new position
   * @param groupIdShort - The idShort of the group the column currently lives in, if any
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async reorderColumn(
    id: string,
    submodelId: string,
    idShortPath: string,
    idShortOfColumn: string,
    data: ReorderColumnDto,
    groupIdShort?: string,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/columns/${idShortOfColumn}/reorder`,
      data,
      { params: groupIdShort ? { groupIdShort } : undefined },
    );
  }

  /**
   * Creates a group from a column in a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param columnIdShort - The idShort of the column to convert to a group
   * @param data - The group data
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async createGroupFromColumnInSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    columnIdShort: string,
    data: SubmodelElementRequestDto,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/groups`,
      { columnIdShort, group: data },
    );
  }

  /**
   * Adds a row to a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param params - Table modification parameters
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async addRowToSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    params: TableModificationParamsDto,
  ) {
    return this.axiosInstance.post<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/rows`,
      undefined,
      { params },
    );
  }

  /**
   * Deletes a row from a Submodel Element List (table).
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element List
   * @param idShortOfRow - The idShort of the row to delete
   * @returns A promise resolving to the updated Submodel Element List
   */
  public async deleteRowFromSubmodelElementList(
    id: string,
    submodelId: string,
    idShortPath: string,
    idShortOfRow: string,
  ) {
    return this.axiosInstance.delete<SubmodelElementListResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/rows/${idShortOfRow}`,
    );
  }

  /**
   * Modifies a Submodel Element.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element
   * @param data - The modification data for the Submodel Element
   * @returns A promise resolving to the modified Submodel Element
   */
  public async modifySubmodelElement(
    id: string,
    submodelId: string,
    idShortPath: string,
    data: SubmodelElementModificationDto,
  ) {
    return this.axiosInstance.patch<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}`,
      data,
    );
  }

  /**
   * Modifies the value of a Submodel Element.
   * @param id - The identifier of the resource
   * @param submodelId - The identifier of the Submodel
   * @param idShortPath - The idShort path to the Submodel Element
   * @param data - The new value data
   * @returns A promise resolving to the updated Submodel Element
   */
  public async modifyValueOfSubmodelElement(
    id: string,
    submodelId: string,
    idShortPath: string,
    data: ValueRequestDto,
  ) {
    return this.axiosInstance.patch<SubmodelElementResponseDto>(
      `${this.aasEndpoint}/${id}/submodels/${submodelId}/submodel-elements/${idShortPath}/$value`,
      data,
    );
  }
}
