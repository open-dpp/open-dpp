import { Module } from '@nestjs/common';
import {PermissionService} from "@app/permission/permission.service";

@Module({
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
