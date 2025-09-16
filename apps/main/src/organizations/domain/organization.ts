import { randomUUID } from 'crypto';
import { User } from '../../users/domain/user';
import { Expose, instanceToPlain, plainToInstance } from 'class-transformer';

export class Organization {
  @Expose()
  readonly id: string = randomUUID();
  @Expose()
  readonly name: string = '';
  @Expose()
  readonly members: User[] = [];
  @Expose()
  readonly createdByUserId: string;
  @Expose()
  readonly ownedByUserId: string = '';

  static fromPlain(plain: Partial<Organization>) {
    return plainToInstance(Organization, plain, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    });
  }

  static create(data: { name: string; user: User }) {
    return Organization.fromPlain({
      name: data.name,
      createdByUserId: data.user.id,
      ownedByUserId: data.user.id,
      members: [data.user],
    });
  }

  join(user: User) {
    if (!this.members.find((m) => m.id === user.id)) {
      this.members.push(user);
    }
  }

  isMember(user: User) {
    return this.members.some((m) => m.id === user.id);
  }

  public toPlain() {
    return instanceToPlain(this);
  }
}
