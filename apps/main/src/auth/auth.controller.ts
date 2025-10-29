import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { toNodeHandler } from "better-auth/node";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { OptionalAuth } from "./optional-auth.decorator";

@Controller("auth")
export class AuthController {
  private readonly authService: AuthService;

  constructor(
    authService: AuthService,
  ) {
    this.authService = authService;
  }

  @Post("*path")
  @OptionalAuth()
  async handleBetterAuthPostRequest(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    console.log(request.body);
    const handler = toNodeHandler(this.authService.auth!);
    await handler(request, response);
  }

  @Get("*path")
  @OptionalAuth()
  async handleBetterAuthGetRequest(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const handler = toNodeHandler(this.authService.auth!);
    await handler(request, response);
  }
}
