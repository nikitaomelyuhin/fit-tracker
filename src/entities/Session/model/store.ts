import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import { clearCache, readCache, writeCache } from '@/shared/lib/offlineCache'
import { isOfflineError } from '@/shared/lib/network'
import type { SessionUser } from './types'

const USER_CACHE_KEY = 'session-user'
/** Сколько ждём восстановления сессии при старте, прежде чем считать, что сети нет. */
const SESSION_WAIT_MS = 5_000

interface AuthForm {
  email: string
  password: string
}

interface State {
  user: SessionUser | null
  form: AuthForm
  loading: boolean
  error: string | null
  ready: boolean
}

export const useSessionStore = defineStore('session', {
  state: (): State => ({
    user: null,
    form: { email: '', password: '' },
    loading: false,
    error: null,
    ready: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
  },

  actions: {
    /**
     * Если токен истёк, getSession пытается обновить его по сети. Без интернета (зал)
     * это либо ошибка, либо долгое ожидание — и раньше пользователя выкидывало на
     * экран входа. Теперь в этом случае берём последнего вошедшего из локальной копии:
     * данные покажутся из кэша, а сессия обновится сама, когда появится сеть.
     */
    async init() {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_WAIT_MS)),
      ])

      if (result?.data.session) {
        this.setUser({ id: result.data.session.user.id, email: result.data.session.user.email ?? null })
      } else if (result === null || isOfflineError(result.error?.message)) {
        this.user = readCache<SessionUser>(USER_CACHE_KEY)
      } else {
        this.user = null
      }

      supabase.auth.onAuthStateChange((event, session) => {
        if (session) this.setUser({ id: session.user.id, email: session.user.email ?? null })
        else if (event === 'SIGNED_OUT') this.user = null
      })

      this.ready = true
    },

    setUser(user: SessionUser) {
      this.user = user
      writeCache(USER_CACHE_KEY, user)
    },

    async signIn(): Promise<boolean> {
      this.loading = true
      this.error = null
      const { error } = await supabase.auth.signInWithPassword({
        email: this.form.email.trim(),
        password: this.form.password,
      })
      if (error) this.error = error.message
      this.loading = false
      return !error
    },

    async signUp(): Promise<boolean> {
      this.loading = true
      this.error = null
      const { error } = await supabase.auth.signUp({
        email: this.form.email.trim(),
        password: this.form.password,
      })
      if (error) this.error = error.message
      this.loading = false
      return !error
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      clearCache()
    },
  },
})
