import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class UserOrIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const userId: unknown = req?.session?.userId;
    if (typeof userId === "string" && userId.length > 0) {
      return `user:${userId}`;
    }
    return `ip:${req.ip}`;
  }
}
