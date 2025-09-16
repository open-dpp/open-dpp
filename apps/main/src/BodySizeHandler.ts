import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, NextFunction, Request, Response } from 'express';

/**
 * Applies body size handling and JSON parsing middleware to the provided Nest application.
 * It selects a larger JSON body limit for specific integration routes and provides
 * robust error handling for payload too large and invalid JSON parsing errors.
 */
export function applyBodySizeHandler(app: INestApplication) {
  const configService = app.get(ConfigService);

  // Single JSON body parser selector based on a precise integration route match
  const integrationRouteRegex = /^\/organizations\/[^/]+\/integration(?:\/|$)/;
  const defaultJsonLimit =
    configService.get<string>('JSON_LIMIT_DEFAULT') || '10mb';
  const integrationJsonLimit =
    configService.get<string>('JSON_LIMIT_INTEGRATION') || '50mb';
  const defaultJsonParser = json({ limit: defaultJsonLimit });
  const integrationJsonParser = json({ limit: integrationJsonLimit });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const parser = integrationRouteRegex.test(req.path)
      ? integrationJsonParser
      : defaultJsonParser;
    return parser(req, res, next);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        statusCode: 413,
        message: 'Payload Too Large',
        error: 'PayloadTooLargeError',
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    }
    if (
      err?.type === 'entity.parse.failed' ||
      (err instanceof SyntaxError && 'body' in err)
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid JSON payload',
        error: 'BadRequest',
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    }
    return next(err);
  });
}
