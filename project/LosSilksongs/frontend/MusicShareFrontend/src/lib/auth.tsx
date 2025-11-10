// ...existing code...
export const TOKEN_KEY = "ms_access_token";
export const USER_KEY = "ms_user";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser<T = any>(): T | null {
  const v = localStorage.getItem(USER_KEY);
  return v ? (JSON.parse(v) as T) : null;
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
}
// ...existing code...