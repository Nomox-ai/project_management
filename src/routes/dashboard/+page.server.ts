import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Keep old /dashboard URL working
export const load: PageServerLoad = async () => {
  throw redirect(303, '/overview');
};
