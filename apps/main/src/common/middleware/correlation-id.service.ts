import { Injectable, Scope } from "@nestjs/common";

// this Scope.Request allow Nest to Inject a new instance of
// the service for every single request, acting like a state
@Injectable({ scope: Scope.REQUEST })
export class CorrelationIdService {
  private correlationId: string;

  getCorrelationId(): string {
    return this.correlationId;
  }

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }
}
