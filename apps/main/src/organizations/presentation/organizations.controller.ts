import { Body, Controller, Get, Param, Patch, Post, Headers, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateOrganizationCommand } from "../../application/commands/create-organization.command";
import { UpdateOrganizationCommand } from "../../application/commands/update-organization.command";
import { GetOrganizationQuery } from "../../application/queries/get-organization.query";
import { GetMembersQuery } from "../../application/queries/get-members.query";
import { InviteMemberCommand } from "../../application/commands/invite-member.command";
import { Organization } from "../../domain/organization";
import { Member } from "../../domain/member";
import { AuthService } from "../../auth/auth.service";

@Controller("organizations")
export class OrganizationsController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly authService: AuthService,
    ) { }

    @Post()
    async createOrganization(
        @Body() body: { name: string; slug: string; logo?: string; metadata?: any },
        @Headers() headers: Record<string, string>,
    ) {
        // We need strict headers type for getSession usually, but let's try casting or passing as is if compatible
        const session = await this.authService.getSession(headers as any);
        if (!session) {
            throw new Error("Unauthorized");
        }
        await this.commandBus.execute(new CreateOrganizationCommand(
            session.user.id,
            body.name,
            body.slug,
            body.logo,
            body.metadata
        ));
    }

    @Patch(":id")
    async updateOrganization(
        @Param("id") id: string,
        @Body() body: { name?: string; slug?: string; logo?: string; metadata?: any },
    ) {
        // TODO: Check permissions (is owner/admin of org)
        await this.commandBus.execute(new UpdateOrganizationCommand(
            id,
            body.name,
            body.slug,
            body.logo,
            body.metadata
        ));
    }

    @Get(":id")
    async getOrganization(@Param("id") id: string): Promise<Organization | null> {
        return this.queryBus.execute(new GetOrganizationQuery(id));
    }

    @Get(":id/members")
    async getMembers(@Param("id") id: string): Promise<Member[]> {
        return this.queryBus.execute(new GetMembersQuery(id));
    }
}
