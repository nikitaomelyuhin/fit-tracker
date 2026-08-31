<template>
  <main :class="$style.auth">
    <BaseCard title="Fit Tracker" :class="$style.card">
      <BaseTextField
        v-model="session.form.email"
        label="Email"
        type="email"
        inputmode="email"
        placeholder="you@example.com"
      />
      <BaseTextField
        v-model="session.form.password"
        label="Пароль"
        type="password"
        placeholder="••••••••"
      />
      <p v-if="session.error" :class="$style.error">{{ session.error }}</p>
      <div :class="$style.actions">
        <BaseButton :disabled="session.loading" @click="onSignIn">Войти</BaseButton>
        <BaseButton variant="ghost" :disabled="session.loading" @click="onSignUp">
          Регистрация
        </BaseButton>
      </div>
    </BaseCard>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { BaseButton, BaseCard, BaseTextField } from '@/shared/ui'

const session = useSessionStore()
const router = useRouter()

async function onSignIn() {
  if (await session.signIn()) router.push({ name: 'dashboard' })
}

async function onSignUp() {
  if (await session.signUp()) router.push({ name: 'dashboard' })
}
</script>

<style module>
.auth {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-l);
}

.card {
  width: 100%;
  max-width: 360px;
}

.actions {
  display: flex;
  gap: var(--space-m);
}

.error {
  color: var(--danger);
  font-size: var(--font-size-s);
}
</style>
