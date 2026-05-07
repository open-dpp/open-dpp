import { Period } from "./period";
import { ValueError } from "@open-dpp/exception";

describe("Period", () => {
  it("is created", () => {
    let startDate = "2011-10-05T14:48:00.000Z";
    let endDate = "2011-11-05T14:48:00.000Z";
    let period = Period.fromIso({ start: startDate, end: endDate });
    expect(period.start).toEqual(new Date(startDate));
    expect(period.end).toEqual(new Date(endDate));

    expect(() => Period.fromIso({ start: endDate, end: startDate })).toThrow(
      new ValueError("Start date must be before end date"),
    );

    period = Period.fromIso({ start: startDate });
    expect(period.start).toEqual(new Date(startDate));
    expect(period.end).toBeNull();

    period = Period.fromIso({ end: endDate });
    expect(period.start).toBeNull();
    expect(period.end).toEqual(new Date(endDate));

    expect(() => Period.fromIso({})).toThrow(
      new ValueError("Either start or end date must be provided"),
    );
  });
});
