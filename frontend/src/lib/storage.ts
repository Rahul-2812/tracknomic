const TOKEN_KEY = "fintrack_token";
const AMOUNTS_VISIBLE_KEY = "fintrack_amounts_visible";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAmountsVisible(): boolean {
  const value = localStorage.getItem(AMOUNTS_VISIBLE_KEY);
  return value == null ? true : value === "true";
}

export function setAmountsVisible(visible: boolean) {
  localStorage.setItem(AMOUNTS_VISIBLE_KEY, String(visible));
}

