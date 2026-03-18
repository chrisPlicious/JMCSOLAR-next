'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, COOKIE_MAX_AGE, generateSessionToken } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login?error=1');
  }

  const token = generateSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  redirect('/admin');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
