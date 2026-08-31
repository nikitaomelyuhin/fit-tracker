import { defineStore } from 'pinia'
import { supabase } from '@/shared/supabase'
import type { SessionUser } from './types'

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
    async init() {
      const { data } = await supabase.auth.getSession()
      this.user = data.session
        ? { id: data.session.user.id, email: data.session.user.email ?? null }
        : null

      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session
          ? { id: session.user.id, email: session.user.email ?? null }
          : null
      })

      this.ready = true
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
    },
  },
})
