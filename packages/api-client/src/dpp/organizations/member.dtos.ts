import { UserDto } from "../users/user.dtos";

export interface MemberDto {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    user?: UserDto;
}
