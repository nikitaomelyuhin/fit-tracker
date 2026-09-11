import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from '@/app/App.vue'
import { router } from '@/app/providers/router'
import { useSessionStore } from '@/entities/Session'
import '@/app/styles/tokens.css'
import '@/app/styles/global.css'

// Иначе новый билд молча ждёт закрытия всех вкладок: страница продолжает работать
// на старом бандле, а свежий контент/фиксы видны только после ручного обновления.
// PWA-окно обычно не переоткрывается заново при возврате из фона, поэтому воркбокс
// не узнает о новой версии сам — досылаем проверку каждый раз, когда вкладка снова видима.
let swRegistration: ServiceWorkerRegistration | undefined
registerSW({
  immediate: true,
  onNeedRefresh: () => window.location.reload(),
  onRegisteredSW: (_url, registration) => {
    swRegistration = registration
  },
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void swRegistration?.update()
})

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())

  // Восстанавливаем сессию до маунта, чтобы гвард роутера знал статус авторизации.
  await useSessionStore().init()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
