export class GetMemberOrganizationsQuery {
  constructor(
    public readonly userId: string,
    public readonly headers: Record<string, string>,
  ) { }
}
