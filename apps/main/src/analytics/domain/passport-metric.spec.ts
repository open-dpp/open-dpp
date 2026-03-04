import { randomUUID } from "node:crypto";
import {
  passportMetricCreateFactory,
  passportMetricFactory,
} from "../fixtures/passport-metric.factory";
import { MeasurementType, PassportMetric } from "./passport-metric";

describe("passportMetric", () => {
  it("should be created", () => {
    const props = passportMetricCreateFactory.build();
    const passportMetric = PassportMetric.create(props);
    expect(passportMetric).toBeInstanceOf(PassportMetric);
    expect(passportMetric.source).toEqual(props.source);
    expect(passportMetric.id).toBeDefined();
    expect(passportMetric.date).toEqual(props.date);
    expect(passportMetric.values).toEqual([]);
  });

  it("should load from db", () => {
    const values = [
      { key: "v1", row: 1, value: 1 },
      { key: "v2", row: 2, value: 2 },
      { key: "v3", row: 3, value: 3 },
    ];
    const props = passportMetricFactory.build({ values, source: { organizationId: "690b3954794fd991d52305ca" } });
    const passportMetric = PassportMetric.loadFromDb(props);
    expect(passportMetric).toBeInstanceOf(PassportMetric);
    expect(passportMetric.source).toEqual(props.source);
    expect(passportMetric.id).toEqual(props.id);
    expect(passportMetric.date).toEqual(props.date);
    expect(passportMetric.values).toEqual(values);
  });

  it("create page view", () => {
    const passportId = randomUUID();
    const templateId = randomUUID();
    const organizationId = randomUUID();
    const page = "http://example.com/page1";
    const date = new Date();
    const passportMetric = PassportMetric.createPageView({
      source: { passportId, templateId, organizationId },
      page,
      date,
    });
    expect(passportMetric).toBeInstanceOf(PassportMetric);

    expect(passportMetric.source.type).toEqual(MeasurementType.PAGE_VIEWS);
    expect(passportMetric.values).toEqual([
      { key: page, row: null, value: 1 },
      { key: "http://example.com", row: null, value: 1 },
    ]);
  });
});
