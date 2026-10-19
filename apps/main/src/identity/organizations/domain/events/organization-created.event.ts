export const ORGANIZATION_CREATED_EVENT = "organization.created";

export class OrganizationCreatedEvent {
  private constructor(public readonly organizationId: string) {}

  static create(data: { organizationId: string }): OrganizationCreatedEvent {
    return new OrganizationCreatedEvent(data.organizationId);
  }
}
