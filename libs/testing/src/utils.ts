import { isArray, isObject, transform } from 'lodash';
import { expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

export function ignoreIds(plain: any) {
  return transform(
    plain,
    (result: Record<string, unknown>, value: unknown, key: string) => {
      if (key === 'id') {
        result[key] = expect.any(String);
      } else if (isObject(value)) {
        result[key] = ignoreIds(value);
      } else if (isArray(value)) {
        result[key] = value.map((item) => ignoreIds(item));
      } else {
        result[key] = value;
      }
    },
  );
}

export function getApp(app: INestApplication): App {
  return app.getHttpServer() as App;
}
