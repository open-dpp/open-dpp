import type { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";
import { expect } from "@jest/globals";
import _ from "lodash";

function mapKeysDeep(
  obj: any,
  cb: (value: unknown, key: string) => string,
): any {
  if (_.isArray(obj)) {
    return obj.map(innerObj => mapKeysDeep(innerObj, cb));
  }
  else if (_.isObject(obj)) {
    return _.mapValues(_.mapKeys(obj, cb), val => mapKeysDeep(val, cb));
  }
  else {
    return obj;
  }
}

export function replaceIdByUnderscoreId(obj: any) {
  return mapKeysDeep(obj, (_, key) => (key === "id" ? "_id" : key));
}

export function replaceUnderscoreIdToId(obj: any) {
  return mapKeysDeep(obj, (_, key) => (key === "_id" ? "id" : key));
}

export function ignoreIds(plain: any) {
  return _.transform(
    plain,
    (result: Record<string, unknown>, value: unknown, key: string) => {
      if (key === "id") {
        result[key] = expect.any(String);
      }
      else if (_.isObject(value)) {
        result[key] = ignoreIds(value);
      }
      else if (_.isArray(value)) {
        result[key] = value.map(item => ignoreIds(item));
      }
      else {
        result[key] = value;
      }
    },
  );
}

export function getApp(app: INestApplication): App {
  return app.getHttpServer() as App;
}
