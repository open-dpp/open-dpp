import { randomBytes } from "node:crypto";

export interface MemberCreateProps {
    organizationId: string;
    userId: string;
    role: string;
}

export type MemberDbProps = MemberCreateProps & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
};

function generate24CharId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
    const random = randomBytes(8).toString("hex");
    return timestamp + random;
}

export class Member {
    public readonly id: string;
    public readonly organizationId: string;
    public readonly userId: string;
    public readonly role: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(
        id: string,
        organizationId: string,
        userId: string,
        role: string,
        createdAt: Date,
        updatedAt: Date
    ) {
        this.id = id;
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static create(data: MemberCreateProps) {
        const now = new Date();
        return new Member(
            generate24CharId(),
            data.organizationId,
            data.userId,
            data.role,
            now,
            now
        );
    }

    public static loadFromDb(data: MemberDbProps) {
        return new Member(
            data.id,
            data.organizationId,
            data.userId,
            data.role,
            data.createdAt,
            data.updatedAt
        );
    }
}
