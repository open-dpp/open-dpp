export const TraceabilityEventType = {
  OPENEPCIS: "OPENEPCIS",
  UNTP: "UNTP",
  OPEN_DPP: "OPEN_DPP",
} as const;

export type TraceabilityEventType_TYPE = (typeof TraceabilityEventType)[keyof typeof TraceabilityEventType];
