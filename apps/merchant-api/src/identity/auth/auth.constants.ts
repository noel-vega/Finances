import { env } from 'src/shared/env';

export const jwtConstants = {
  secret: env.STAFF_JWT_SECRET,
};
