import type { NextFunction, Request, Response } from "express";

/**
 * Restricts which websites may show open-dpp in an iframe to open-dpp itself and the
 * configured embed origins (OPEN_DPP_EMBED_ORIGINS), as protection against clickjacking.
 * Without embed origins it sends nothing and leaves framing as the browser defaults it: the
 * auth cookies are SameSite=Lax then and are not sent into cross-site frames anyway.
 */
export function createFrameAncestorsMiddleware(embedOrigins: readonly string[]) {
  const policy =
    embedOrigins.length > 0 ? `frame-ancestors ${["'self'", ...embedOrigins].join(" ")}` : null;

  return function frameAncestorsMiddleware(_req: Request, res: Response, next: NextFunction) {
    if (policy) {
      res.setHeader("Content-Security-Policy", policy);
    }
    next();
  };
}
