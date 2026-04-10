import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { checkCredentials, makeSessionCookie, COOKIE_NAME } from '$lib/server/auth';

// If already authenticated, go straight to dashboard
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.authenticated) throw redirect(303, '/dashboard');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = (form.get('username') as string ?? '').trim();
    const password = form.get('password') as string ?? '';

    if (!checkCredentials(username, password)) {
      return { error: 'Invalid username or password' };
    }

    cookies.set(COOKIE_NAME, makeSessionCookie(), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 8 // 8 hours
    });

    throw redirect(303, '/dashboard');
  }
};
