<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { APP_META } from '@/types/user';

const router = useRouter();
const auth = useAuthStore();

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (loading.value) return;
  loading.value = true;
  error.value = null;
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password });
    router.push(APP_META[user.userType].home);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '로그인에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth">
    <header class="head">
      <p class="eyebrow">로그인</p>
      <h1 class="title">다시 오셨군요</h1>
      <p class="desc">가입한 유형의 앱으로 접속합니다.</p>
    </header>

    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label class="label" for="email">이메일</label>
        <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
      </div>

      <div class="field">
        <label class="label" for="password">비밀번호</label>
        <input id="password" v-model="form.password" class="input" type="password" autocomplete="current-password" placeholder="비밀번호" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn primary" type="submit" :disabled="loading">
        {{ loading ? '확인 중…' : '로그인' }}
      </button>
    </form>

    <p class="switch">
      아직 계정이 없으신가요?
      <RouterLink class="link" to="/signup">회원가입</RouterLink>
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
