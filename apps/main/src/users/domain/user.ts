import { Expose } from 'class-transformer';

export class User {
  @Expose()
  public readonly id: string;
  @Expose()
  public readonly email: string;
  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }
}
