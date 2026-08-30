// decodes the access token's payload client-side rather than adding a
// /users/me round trip — the JWT already carries email/accountId, see
// AuthService.createToken on the server
export function decodeAccessToken(accessToken: string):
  | {
      sub: number;
      email: string;
      accountId: number;
      firstName: string;
      lastName: string;
    }
  | undefined {
  try {
    const payload = accessToken.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return undefined;
  }
}
