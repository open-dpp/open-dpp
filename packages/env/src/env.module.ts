import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from './env'
import { EnvService } from './env.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: env => validateEnv(env),
      isGlobal: true,
      expandVariables: true,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
