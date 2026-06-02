<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { APP_META, type UserType } from '@/types/user';

const router = useRouter();
const auth = useAuthStore();

const TYPES: { value: UserType; label: string; app: string }[] = [
  { value: 'LANDLORD', label: '임대인', app: 'Butler Landlord' },
  { value: 'TENANT', label: '임차인', app: 'Butler Tenant' },
  { value: 'AGENT', label: '중개업자', app: 'Butler Agent' },
];

const form = reactive({
  name: '',
  email: '',
  password: '',
  userType: '' as UserType | '',
});
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (loading.value) return;
  if (!form.userType) {
    error.value = '사용자 유형을 선택해 주세요.';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const user = await auth.signup({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      userType: form.userType,
    });
    router.push(APP_META[user.userType].home);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '회원가입에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth">
    <header class="head">
      <p class="eyebrow">회원가입</p>
      <h1 class="title">계정을 만드세요</h1>
      <p class="desc">사용자 유형에 따라 사용하는 앱이 결정됩니다.</p>
    </header>

    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label class="label">사용자 유형</label>
        <div class="types">
          <button
            v-for="t in TYPES"
            :key="t.value"
            type="button"
            class="type"
            :class="{ active: form.userType === t.value }"
            @click="form.userType = t.value"
          >
            <span class="type-label">{{ t.label }}</span>
            <span class="type-app">{{ t.app }}</span>
          </button>
        </div>
      </div>

      <div class="field">
        <label class="label" for="name">이름</label>
        <input id="name" v-model="form.name" class="input" type="text" autocomplete="name" placeholder="홍길동" />
      </div>

      <div class="field">
        <label class="label" for="email">이메일</label>
        <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
      </div>

      <div class="field">
        <label class="label" for="password">비밀번호</label>
        <input id="password" v-model="form.password" class="input" type="password" autocomplete="new-password" placeholder="8자 이상" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn primary" type="submit" :disabled="loading">
        {{ loading ? '처리 중…' : '가입하고 시작' }}
      </button>
    </form>

    <p class="switch">
      이미 계정이 있으신가요?
      <RouterLink class="link" to="/login">로그인</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink);
}
.title {
  font-size: 28px;
  font-weight: 700;
}
.desc {
  margin: 0;
  font-size: 14px;
  color: var(--ink-2);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}
.types {
  display: flex;
  gap: 8px;
}
.type {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  border: 1px solid var(--slate-200);
  border-radius: var(--r-input);
  background: var(--paper);
  cursor: pointer;
  transition: all var(--d-base) var(--ease-out);
}
.type.active {
  border-color: var(--ink);
  background: var(--ink);
}
.type-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.type.active .type-label {
  color: var(--paper);
}
.type-app {
  font-size: 10px;
  color: var(--ink-3);
}
.type.active .type-app {
  color: var(--brass-soft);
}
.input {
  appearance: none;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--slate-300);
  border-radius: var(--r-input);
  background: var(--paper-raised);
  font-size: 15px;
  font-family: inherit;
  color: var(--ink);
}
.input:focus {
  outline: none;
  border-color: var(--ink);
  border-width: 1.5px;
}
.error {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.btn {
  appearance: none;
  border: none;
  border-radius: var(--r-pill);
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn.primary {
  background: var(--ink);
  color: var(--paper);
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.switch {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
  text-align: center;
}
.link {
  color: var(--ink);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
