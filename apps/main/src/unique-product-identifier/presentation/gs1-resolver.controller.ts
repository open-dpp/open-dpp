import type { Request, Response } from "express";
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Req,
  Res,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { Cset82ComponentSchema, GtinInputSchema } from "@open-dpp/dto";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { Gs1IdentityService } from "../application/services/gs1-identity.service";

@Controller({ version: VERSION_NEUTRAL })
export class Gs1ResolverController {
  private readonly logger = new Logger(Gs1ResolverController.name);

  constructor(private readonly gs1IdentityService: Gs1IdentityService) {}

  @OptionalAuth()
  @Get("01/:gtin")
  async resolveGtin(
    @Param("gtin") gtin: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin }, req, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/10/:batch")
  async resolveGtinBatch(
    @Param("gtin") gtin: string,
    @Param("batch") batch: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, batch }, req, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/21/:serial")
  async resolveGtinSerial(
    @Param("gtin") gtin: string,
    @Param("serial") serial: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, serial }, req, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/10/:batch/21/:serial")
  async resolveGtinBatchSerial(
    @Param("gtin") gtin: string,
    @Param("batch") batch: string,
    @Param("serial") serial: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, batch, serial }, req, res);
  }

  private async resolve(
    raw: { gtin: string; batch?: string; serial?: string },
    req: Request,
    res: Response,
  ): Promise<void> {
    const parsedGtin = GtinInputSchema.safeParse(raw.gtin);
    if (!parsedGtin.success) {
      throw new NotFoundException(`Invalid GTIN: ${raw.gtin}`);
    }
    const batch = this.parseComponentOr404(raw.batch, "batch");
    const serial = this.parseComponentOr404(raw.serial, "serial");

    const key = { gtin: parsedGtin.data, batch, serial };
    const publicUrl = await this.gs1IdentityService.resolveGs1KeyToPublicUrl(key);
    const target = this.withForwardedQuery(publicUrl, req);
    this.logger.debug(`Resolved GS1 Digital Link ${this.describeKey(key)} → ${target}`);
    res.redirect(HttpStatus.FOUND, target);
  }

  private withForwardedQuery(publicUrl: string, req: Request): string {
    const queryStart = req.originalUrl.indexOf("?");
    if (queryStart === -1) {
      return publicUrl;
    }
    const existing = new Set((publicUrl.split("?")[1] ?? "").split("&").filter(Boolean));
    const forwarded = req.originalUrl
      .slice(queryStart + 1)
      .split("&")
      .filter((pair) => pair !== "" && !existing.has(pair));
    if (forwarded.length === 0) {
      return publicUrl;
    }
    return `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}${forwarded.join("&")}`;
  }

  private parseComponentOr404(value: string | undefined, label: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const decoded = this.decodeOr404(value, label);
    const parsed = Cset82ComponentSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new NotFoundException(`Invalid ${label}: ${value}`);
    }
    return parsed.data;
  }

  private decodeOr404(value: string, label: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      throw new NotFoundException(`Invalid ${label}: ${value}`);
    }
  }

  private describeKey(key: { gtin: string; batch?: string; serial?: string }): string {
    let path = `/01/${key.gtin}`;
    if (key.batch !== undefined) path += `/10/${key.batch}`;
    if (key.serial !== undefined) path += `/21/${key.serial}`;
    return path;
  }
}
