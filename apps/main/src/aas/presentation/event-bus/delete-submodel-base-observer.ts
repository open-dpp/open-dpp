import { DeleteSubmodelBaseEvent } from "./submodel-base-events";
import { DbSessionOptions } from "../../../database/query-options";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { type DigitalProductDocumentTypesType } from "@open-dpp/dto";

export interface DeleteSubmodelBaseObserver {
  onDelete(event: DeleteSubmodelBaseEvent, options?: DbSessionOptions): Promise<void>;
}

export class SecurityDeletionObserver implements DeleteSubmodelBaseObserver {
  private constructor(private readonly aas: AssetAdministrationShell) {}
  static create(data: { aas: AssetAdministrationShell }) {
    return new SecurityDeletionObserver(data.aas);
  }
  async onDelete(event: DeleteSubmodelBaseEvent, _options?: DbSessionOptions) {
    this.aas.withTracking().security.deletePoliciesByObjectPath(event.pathToDelete);
  }
}

export class PresentationDeletionObserver implements DeleteSubmodelBaseObserver {
  private constructor(
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private digitalProductDocumentId: string,
    private readonly digitalProductDocumentType: DigitalProductDocumentTypesType,
  ) {}
  static create(data: {
    presentationConfigurationService: PresentationConfigurationService;
    digitalProductDocumentId: string;
    digitalProductDocumentType: DigitalProductDocumentTypesType;
  }) {
    return new PresentationDeletionObserver(
      data.presentationConfigurationService,
      data.digitalProductDocumentId,
      data.digitalProductDocumentType,
    );
  }
  async onDelete(event: DeleteSubmodelBaseEvent, options?: DbSessionOptions) {
    await this.presentationConfigurationService.deleteElementDesignEntriesForPath(
      this.digitalProductDocumentType,
      this.digitalProductDocumentId,
      event.pathToDelete.toString(),
      options,
    );
  }
}
