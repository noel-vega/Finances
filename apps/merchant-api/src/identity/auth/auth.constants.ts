import { env } from '../../env';

export const jwtConstants = {
  secret: env.STAFF_JWT_SECRET,
};
