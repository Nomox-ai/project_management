import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { validateSession, COOKIE_NAME } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const isPublic = path.startsWith('/login');

  const session = event.cookies.get(COOKIE_NAME);
  event.locals.authenticated = validateSession(session);

  if (!isPublic && !event.locals.authenticated) {
    throw redirect(303, '/login');
  }

  // If already logged in and hitting /login, send to dashboard
  if (isPublic && event.locals.authenticated) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};
