import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { DashboardPage } from '@/pages/dashboard'
import { AuthPage } from '@/pages/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  { path: '/auth', name: 'auth', component: AuthPage },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isAuthenticated) return { name: 'auth' }
  if (to.name === 'auth' && session.isAuthenticated) return { name: 'dashboard' }
  return true
})
