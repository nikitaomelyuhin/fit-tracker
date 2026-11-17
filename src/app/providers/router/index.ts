import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/entities/Session'
import { DashboardPage } from '@/pages/dashboard'
import { AuthPage } from '@/pages/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/today' },
  // Старые адреса вкладок (закладки, установленная PWA) ведут на новые.
  { path: '/weight', redirect: '/today' },
  { path: '/analytics', redirect: '/progress' },
  {
    path: '/:tab(today|nutrition|workouts|progress|photos)',
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
  // Новая вкладка открывается сверху; «назад» возвращает туда, где был.
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isAuthenticated) return { name: 'auth' }
  if (to.name === 'auth' && session.isAuthenticated) return '/today'
  return true
})
