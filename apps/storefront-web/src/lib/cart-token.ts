const CART_TOKEN_STORAGE_KEY = "cartToken";

export function getStoredCartToken(): string | undefined {
  return localStorage.getItem(CART_TOKEN_STORAGE_KEY) ?? undefined;
}

export function setStoredCartToken(token: string | undefined) {
  if (token) {
    localStorage.setItem(CART_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(CART_TOKEN_STORAGE_KEY);
  }
}
