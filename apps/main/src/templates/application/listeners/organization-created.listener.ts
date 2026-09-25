import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  ORGANIZATION_CREATED_EVENT,
  OrganizationCreatedEvent,
} from "../../../identity/organizations/domain/events/organization-created.event";
import { OfficialTemplatesImportService } from "../services/official-templates-import.service";

@Injectable()
export class OrganizationCreatedListener {
  private readonly logger = new Logger(OrganizationCreatedListener.name);

  constructor(private readonly officialTemplatesImportService: OfficialTemplatesImportService) {}

  @OnEvent(ORGANIZATION_CREATED_EVENT)
  handleOrganizationCreated(event: OrganizationCreatedEvent): void {
    try {
      this.officialTemplatesImportService
        .importOfficialTemplates(event.organizationId)
        .catch((error) => {
          this.logger.error(
            `Failed to seed official templates for organization ${event.organizationId}`,
            error,
          );
        });
    } catch (error) {
      this.logger.error(
        `Failed to start official templates seed for organization ${event.organizationId}`,
        error,
      );
    }
  }
}
