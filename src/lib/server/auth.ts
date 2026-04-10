import { env } from '$env/dynamic/private';

export const COOKIE_NAME = 'tm_session';

export function checkCredentials(username: string, password: string): boolean {
  return username === env.AUTH_USERNAME && password === env.AUTH_PASSWORD;
}

export function makeSessionCookie(): string {
  const payload = `authenticated:${env.AUTH_SECRET}`;
  return Buffer.from(payload).toString('base64');
}

export function validateSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    return decoded === `authenticated:${env.AUTH_SECRET}`;
  } catch {
    return false;
  }
}
