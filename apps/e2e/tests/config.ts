import { envSchema } from '@open-dpp/env';
import process from 'node:process';
import {v4 as uuid4} from 'uuid';
import { z } from 'zod';

export const EnvConfig = envSchema.parse(process.env);
export const User = z.object({
  E2E_USERNAME: z.string(),
  E2E_PASSWORD: z.string(),
}).parse(process.env);
export const ExampleOrganisation = `ExampleOrg-${uuid4()}`;