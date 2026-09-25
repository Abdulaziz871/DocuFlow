'use client';

import Cookies from 'js-cookie';
import apiClient from './apiClient';
import type { User } from '@/types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  Cookies.set('df_token', data.data.token, { expires: 7 });
  return data.data.user as User;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user as User;
  } catch {
    return null;
  }
}

export function logout() {
  Cookies.remove('df_token');
  window.location.href = '/login';
}
