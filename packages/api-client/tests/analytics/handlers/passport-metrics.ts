import type {
  PassportMeasurementDto,
  PassportMetricQueryDto,
} from '../../../src'

import { randomUUID } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import {
  MeasurementType,
  TimePeriod,
} from '../../../src'
import { activeOrganization } from '../../organization'
import { analyticsUrl } from './index'

export const passportMetricQueryDto: PassportMetricQueryDto = {
  startDate: new Date('2025-01-01T12:00:00Z'),
  endDate: new Date('2025-02-01T12:00:00Z'),
  templateId: 't1',
  modelId: 'm1',
  type: MeasurementType.PAGE_VIEWS,
  valueKey: 'https://example.com/passport',
  period: TimePeriod.MONTH,
  timezone: 'Europe/Berlin',
}

export const passportMeasurementDto: PassportMeasurementDto = {
  datetime: new Date('2025-01-01T13:00:00Z').toISOString(),
  sum: 9,
}

export const pageViewDto = {
  id: randomUUID(),
}

export const passportMetricHandler = [
  http.post(`${analyticsUrl}/passport-metrics/page-views`, () =>
    HttpResponse.json(pageViewDto)),
  http.get(
    `${analyticsUrl}/organizations/${activeOrganization.id}/passport-metrics`,
    ({ request }) => {
      const url = new URL(request.url)

      const errors: string[] = []

      const assertParam = (
        paramName: keyof PassportMetricQueryDto,
        expected: string,
      ) => {
        const received = url.searchParams.get(paramName)
        if (received !== expected) {
          errors.push(
            `Parameter "${paramName}" mismatch:\n`
            + `  Expected: ${expected}\n`
            + `  Received: ${received}`,
          )
        }
      }

      // Check each parameter
      assertParam('endDate', passportMetricQueryDto.endDate.toISOString())
      assertParam('startDate', passportMetricQueryDto.startDate.toISOString())
      assertParam('templateId', passportMetricQueryDto.templateId)
      assertParam('modelId', passportMetricQueryDto.modelId || '')
      assertParam('type', passportMetricQueryDto.type)
      assertParam('valueKey', passportMetricQueryDto.valueKey)
      assertParam('period', passportMetricQueryDto.period)

      // If there are any errors, throw them with detailed information
      if (errors.length > 0) {
        return HttpResponse.json(
          {
            message: 'Query parameters validation failed',
            details: errors,
            receivedUrl: request.url,
            expectedParams: passportMetricQueryDto,
          },
          { status: 500 },
        )
      }

      return HttpResponse.json([passportMeasurementDto])
    },
  ),
]
