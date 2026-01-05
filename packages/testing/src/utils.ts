import type { INestApplication } from '@nestjs/common'
import type { App } from 'supertest/types'
import _ from 'lodash'

export function ignoreIds(plain: any) {
  return _.transform(
    plain,
    (result: Record<string, unknown>, value: unknown, key: string) => {
      if (key === 'id') {
        result[key] = expect.any(String)
      }
      else if (_.isObject(value)) {
        result[key] = ignoreIds(value)
      }
      else if (_.isArray(value)) {
        result[key] = value.map(item => ignoreIds(item))
      }
      else {
        result[key] = value
      }
    },
  )
}

export function getApp(app: INestApplication): App {
  return app.getHttpServer() as App
}
