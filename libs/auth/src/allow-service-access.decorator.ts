// For internal communication between microservices where no jwt token is available
import { SetMetadata } from '@nestjs/common';

export const ALLOW_SERVICE_ACCESS = 'allowServiceAccess';
export const AllowServiceAccess = (...args: string[]) =>
  SetMetadata(ALLOW_SERVICE_ACCESS, args);
