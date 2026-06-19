'use server';

import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  SESSION_COOKIE,
  COOKIE_MAX_AGE,
  COOKIE_MAX_AGE_REMEMBER,
  TOKEN_TTL_MS,
  TOKEN_TTL_REMEMBER_MS,
  generateSessionToken,
} from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW = 15 * 60 * 1000;

export async function loginAction(formData: FormData) {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const { allowed } = await rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW);
  if (!allowed) {
    redirect('/admin/login?error=2');
  }

  const password = formData.get('password') as string;
  const next = formData.get('next') as string | null;
  const remember = formData.get('remember') === 'on';

  const expected = process.env.ADMIN_PASSWORD;
  const a = Buffer.from(password ?? '');
  const b = Buffer.from(expected ?? '');
  const match = a.length > 0 && b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    redirect('/admin/login?error=1');
  }

  // "Remember me" → long-lived session; otherwise the default short window.
  const ttlMs = remember ? TOKEN_TTL_REMEMBER_MS : TOKEN_TTL_MS;
  const maxAge = remember ? COOKIE_MAX_AGE_REMEMBER : COOKIE_MAX_AGE;

  const token = generateSessionToken(ttlMs);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/',
  });

  // H4: Redirect to intended admin path if valid, else /admin
  const redirectTo =
    next && next.startsWith('/admin/') && !next.includes('..') ? next : '/admin';
  redirect(redirectTo);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
