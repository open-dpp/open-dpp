import { HttpException, HttpStatus } from "@nestjs/common";

export class LimitExceededException extends HttpException {
  constructor(details: {
    limit: number;
    used: number;
    key: string;
  }) {
    super(
      {
        error: "limit_exceeded",
        message: "Limit exceeded",
        ...details,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
