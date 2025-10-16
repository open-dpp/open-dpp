export class OrganizationSubject {
  id: string;
  ownedByUserId: string;
  members: string[];

  constructor(id: string, ownerUserId: string, members: string[]) {
    this.id = id;
    this.ownedByUserId = ownerUserId;
    this.members = members;
  }
}
