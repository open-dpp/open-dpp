import type { AxiosInstance } from 'axios'
import type {
  DataFieldDraftCreateDto,
  DataFieldDraftUpdateDto,
  MoveDto,
  PublicationCreateDto,
  SectionDraftCreateDto,
  SectionDraftUpdateDto,
  TemplateDraftCreateDto,
  TemplateDraftDto,
  TemplateDraftGetAllDto,
  TemplateDraftUpdateDto,
} from './template-draft.dtos'

export class TemplateDraftsNamespace {
  private readonly draftsEndpoint
  constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly organizationId?: string,
  ) {
    this.draftsEndpoint = `/organizations/${this.organizationId}/template-drafts`
  }

  public async create(data: TemplateDraftCreateDto) {
    return this.axiosInstance.post<TemplateDraftDto>(this.draftsEndpoint, data)
  }

  public async getAll() {
    return this.axiosInstance.get<TemplateDraftGetAllDto[]>(
      this.draftsEndpoint,
    )
  }

  public async getById(draftId: string) {
    return this.axiosInstance.get<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}`,
    )
  }

  public async modify(draftId: string, data: TemplateDraftUpdateDto) {
    return this.axiosInstance.patch<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}`,
      data,
    )
  }

  public async addSection(draftId: string, data: SectionDraftCreateDto) {
    return this.axiosInstance.post<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections`,
      data,
    )
  }

  public async addDataField(
    draftId: string,
    sectionId: string,
    data: DataFieldDraftCreateDto,
  ) {
    return this.axiosInstance.post<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}/data-fields`,
      data,
    )
  }

  public async modifyDataField(
    draftId: string,
    sectionId: string,
    fieldId: string,
    data: DataFieldDraftUpdateDto,
  ) {
    return this.axiosInstance.patch<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}/data-fields/${fieldId}`,
      data,
    )
  }

  public async deleteDataField(
    draftId: string,
    sectionId: string,
    fieldId: string,
  ) {
    return this.axiosInstance.delete<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}/data-fields/${fieldId}`,
    )
  }

  public async deleteSection(draftId: string, sectionId: string) {
    return this.axiosInstance.delete<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}`,
    )
  }

  public async modifySection(
    draftId: string,
    sectionId: string,
    data: SectionDraftUpdateDto,
  ) {
    return this.axiosInstance.patch<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}`,
      data,
    )
  }

  public async moveSection(draftId: string, sectionId: string, data: MoveDto) {
    return this.axiosInstance.post<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}/move`,
      data,
    )
  }

  public async moveDataField(
    draftId: string,
    sectionId: string,
    dataFieldId: string,
    data: MoveDto,
  ) {
    return this.axiosInstance.post<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/sections/${sectionId}/data-fields/${dataFieldId}/move`,
      data,
    )
  }

  public async publish(draftId: string, data: PublicationCreateDto) {
    return this.axiosInstance.post<TemplateDraftDto>(
      `${this.draftsEndpoint}/${draftId}/publish`,
      data,
    )
  }
}
