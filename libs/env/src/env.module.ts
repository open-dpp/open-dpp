import { Module } from '@nestjs/common';
import { EnvService } from './env.service';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => validateEnv(env),
      isGlobal: true,
      expandVariables: true,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
