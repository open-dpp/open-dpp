import { User } from "../user";

export abstract class UsersRepositoryPort {
    abstract save(user: User): Promise<void>;
    abstract findOneById(id: string): Promise<User | null>;
    abstract findOneByEmail(email: string): Promise<User | null>;
    abstract findAllByIds(ids: string[]): Promise<User[]>;
}
