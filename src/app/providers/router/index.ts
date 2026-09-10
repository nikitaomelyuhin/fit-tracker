import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { DashboardPage } from '@/pages/dashboard'
import { AuthPage } from '@/pages/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/weight' },
  {
    path: '/:tab(weight|measurements|workouts|nutrition|analytics)',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  { path: '/auth', name: 'auth', component: AuthPage },
]

export const router = createRouter({
  // BASE_URL берётся из Vite --base (см. workflow деплоя) — так роутер работает
  // и в корне домена, и в подпапке (например, GitHub Pages: /fit-tracker/).
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isAuthenticated) return { name: 'auth' }
  if (to.name === 'auth' && session.isAuthenticated) return '/weight'
  return true
})
