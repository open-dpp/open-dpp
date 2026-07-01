import type { Response } from "express";
import { Controller, Get, HttpStatus, Logger, NotFoundException, Param, Res } from "@nestjs/common";
import { Cset82ComponentSchema, GtinInputSchema } from "@open-dpp/dto";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { Gs1IdentityService } from "../application/services/gs1-identity.service";

/**
 * Public GS1 Digital Link resolver.
 *
 * Mounted OUTSIDE the `/api` global prefix (carved out in `main.ts` for the dev
 * Vite proxy, and reachable in prod via ServeStatic `fallthrough`). A scanned
 * `/01/{gtin}` — optionally with `/10/{batch}` and/or `/21/{serial}` —
 * 302-redirects to the passport's permalink public URL. Publish gating and
 * "unknown key → 404" are inherited from the resolution service. Resolution is on
 * the EXACT full key, so a serialized unit and a bare GTIN never shadow each other.
 */
@Controller()
export class Gs1ResolverController {
  private readonly logger = new Logger(Gs1ResolverController.name);

  constructor(private readonly gs1IdentityService: Gs1IdentityService) {}

  @OptionalAuth()
  @Get("01/:gtin")
  async resolveGtin(@Param("gtin") gtin: string, @Res() res: Response): Promise<void> {
    await this.resolve({ gtin }, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/10/:batch")
  async resolveGtinBatch(
    @Param("gtin") gtin: string,
    @Param("batch") batch: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, batch }, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/21/:serial")
  async resolveGtinSerial(
    @Param("gtin") gtin: string,
    @Param("serial") serial: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, serial }, res);
  }

  @OptionalAuth()
  @Get("01/:gtin/10/:batch/21/:serial")
  async resolveGtinBatchSerial(
    @Param("gtin") gtin: string,
    @Param("batch") batch: string,
    @Param("serial") serial: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.resolve({ gtin, batch, serial }, res);
  }

  /**
   * Validate the scanned key segments at the boundary and 302-redirect to the
   * resolved permalink URL. A malformed GTIN, batch, or serial can never resolve
   * to a passport, so it surfaces as a 404.
   */
  private async resolve(
    raw: { gtin: string; batch?: string; serial?: string },
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
    this.logger.debug(`Resolved GS1 Digital Link ${this.describeKey(key)} → ${publicUrl}`);
    res.redirect(HttpStatus.FOUND, publicUrl);
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
