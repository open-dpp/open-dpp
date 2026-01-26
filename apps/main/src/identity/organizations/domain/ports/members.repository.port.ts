import { Member } from "../member";

export abstract class MembersRepositoryPort {
  abstract save(member: Member): Promise<void>;
  abstract findOneById(id: string): Promise<Member | null>;
  abstract findByOrganizationId(organizationId: string): Promise<Member[]>;
  abstract findByUserId(userId: string): Promise<Member[]>;
  abstract findOneByUserIdAndOrganizationId(userId: string, organizationId: string): Promise<Member | null>;
}
