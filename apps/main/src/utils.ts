import _ from "lodash";

export function removeEmptyItems(items: any[]): any[] {
  return items.filter(item => Object.keys(item).length > 0);
}

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
