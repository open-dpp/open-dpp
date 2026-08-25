import { MoveSubmodelBaseEvent } from "./submodel-base-events";
import { DbSessionOptions } from "../../../database/query-options";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import type { DigitalProductDocumentTypesType } from "@open-dpp/dto";

export interface MoveSubmodelBaseObserver {
  onMove(event: MoveSubmodelBaseEvent, options?: DbSessionOptions): Promise<void>;
}

export class SecurityMoveObserver implements MoveSubmodelBaseObserver {
  private constructor(private readonly aas: AssetAdministrationShell) {}
  static create(data: { aas: AssetAdministrationShell }) {
    return new SecurityMoveObserver(data.aas);
  }
  async onMove(event: MoveSubmodelBaseEvent, _options?: DbSessionOptions) {
    this.aas.withTracking().security.movePolicy(event.oldPath, event.newPath);
  }
}

export class PresentationMoveObserver implements MoveSubmodelBaseObserver {
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
    return new PresentationMoveObserver(
      data.presentationConfigurationService,
      data.digitalProductDocumentId,
      data.digitalProductDocumentType,
    );
  }
  async onMove(event: MoveSubmodelBaseEvent, options?: DbSessionOptions) {
    await this.presentationConfigurationService.moveElementDesignEntries(
      this.digitalProductDocumentType,
      this.digitalProductDocumentId,
      event.oldPath.toString(),
      event.newPath.toString(),
      options,
    );
  }
}
