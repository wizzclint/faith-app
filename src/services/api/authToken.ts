/**
 * A tiny module-level token holder, separate from authStore.ts, so the API
 * client doesn't need to import the store (which itself imports the client
 * to call /auth endpoints) — that pairing was a real require cycle Metro
 * flagged on-device. authStore.ts is the only writer; client.ts is the only
 * reader.
 */
let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}

/** authStore registers its sign-out here, so an expired token returns the UI to "sync again". */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}
