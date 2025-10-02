// For internal communication between microservices where no jwt token is available
import { SetMetadata } from '@nestjs/common'

export const ALLOW_SERVICE_ACCESS = 'allowServiceAccess'
export function AllowServiceAccess(...args: string[]) {
  return SetMetadata(ALLOW_SERVICE_ACCESS, args)
}
