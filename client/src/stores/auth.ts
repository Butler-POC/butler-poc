// Created: 2026-05-30 10:57
import { defineStore } from 'pinia';
import { TOKEN_KEY } from '@/api/client';
import * as authApi from '@/api/auth';
import type { User, UserType } from '@/types/user';

const USER_KEY = 'butler_user';

function loadUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) as string | null,
    user: loadUser(),
  }),

  getters: {
    isAuthed: (s): boolean => !!s.token && !!s.user,
    userType: (s): UserType | null => s.user?.userType ?? null,
  },

  actions: {
    setSession(token: string, user: User) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    async signup(payload: {
      email: string;
      password: string;
      name: string;
      userType: UserType;
    }): Promise<User> {
      const r = await authApi.signup(payload);
      this.setSession(r.token, r.user);
      return r.user;
    },

    async login(payload: { email: string; password: string }): Promise<User> {
      const r = await authApi.login(payload);
      this.setSession(r.token, r.user);
      return r.user;
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    /** 저장된 토큰이 유효한지 서버에 확인하고 사용자 정보 갱신 */
    async refresh() {
      if (!this.token) return;
      try {
        const u = await authApi.fetchMe();
        this.user = u;
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      } catch {
        this.logout();
      }
    },
  },
});
