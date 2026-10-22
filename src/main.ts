import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import { router } from '@/app/providers/router'
import { setupPwaUpdates } from '@/app/providers/pwa'
import { disablePageZoom } from '@/app/providers/viewport'
import { useSessionStore } from '@/entities/Session'
import '@/app/styles/tokens.css'
import '@/app/styles/global.css'

disablePageZoom()

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())
  setupPwaUpdates()

  // Восстанавливаем сессию до маунта, чтобы гвард роутера знал статус авторизации.
  await useSessionStore().init()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
