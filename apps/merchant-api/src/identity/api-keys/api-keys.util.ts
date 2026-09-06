import { generateToken } from '../../shared/common/generate-token.util';

export function generateApiKey(): string {
  return `sfk_${generateToken(24)}`;
}
