import { AuthContext } from '@app/auth/auth-request';

declare global {
  namespace Express {
    export interface Request {
      authContext: AuthContext;
    }
  }
}

export {};
