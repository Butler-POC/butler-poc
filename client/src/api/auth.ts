// Created: 2026-05-30 10:57
import { api } from '@/api/client';
import type { User, UserType } from '@/types/user';

export interface AuthResult {
  token: string;
  user: User;
}

export function signup(payload: {
  email: string;
  password: string;
  name: string;
  userType: UserType;
}): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/signup', payload).then((r) => r.data);
}

export function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', payload).then((r) => r.data);
}

export function fetchMe(): Promise<User> {
  return api.get<{ user: User }>('/auth/me').then((r) => r.data.user);
}
