import { isArray, isObject, transform } from 'lodash';
import { expect } from '@jest/globals';

export function ignoreIds(plain: any) {
  return transform(plain, (result, value, key) => {
    if (key === 'id') {
      result[key] = expect.any(String);
    } else if (isObject(value)) {
      result[key] = ignoreIds(value);
    } else if (isArray(value)) {
      result[key] = value.map((item) => ignoreIds(item));
    } else {
      result[key] = value;
    }
  });
}
