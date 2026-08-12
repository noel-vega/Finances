import { generateToken } from '../../common/generate-token.util';

export function generateApiKey(): string {
  return `sfk_${generateToken(24)}`;
}
