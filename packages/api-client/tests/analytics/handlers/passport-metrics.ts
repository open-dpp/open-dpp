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
import { checkQueryParameters } from '../../utils'
import { analyticsUrl } from './index'

export const passportMetricQueryDto: PassportMetricQueryDto = {
  startDate: new Date('2025-01-01T12:00:00Z'),
  endDate: new Date('2025-02-01T12:00:00Z'),
  templateId: 't1',
  modelId: 'm1',
  type: MeasurementType.PAGE_VIEWS,
  valueKey: 'https://example.com/passport',
  period: TimePeriod.MONTH,
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
      checkQueryParameters(request, {
        endDate: passportMetricQueryDto.endDate.toISOString(),
        startDate: passportMetricQueryDto.startDate.toISOString(),
        templateId: passportMetricQueryDto.templateId,
        modelId: passportMetricQueryDto.modelId || '',
        type: passportMetricQueryDto.type,
        valueKey: passportMetricQueryDto.valueKey,
        period: passportMetricQueryDto.period,
      })

      return HttpResponse.json([passportMeasurementDto])
    },
  ),
]
