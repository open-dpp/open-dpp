import type { TestingModule } from "@nestjs/testing";
import type { KeycloakUserInToken } from "@open-dpp/auth";
import type { Repository } from "typeorm";
import { expect } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../domain/user";
import { UsersService } from "./users.service";

describe("usersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });
});
