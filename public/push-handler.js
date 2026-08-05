/* Push handlers for PWA service worker (imported by Workbox). */
self.addEventListener('push', (event) => {
  let data = { title: 'Ресурс', body: 'Новое уведомление', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) {
    try {
      data.body = event.data.text()
    } catch (_) {}
  }
  const scope = self.registration.scope
  const icon = new URL('icons/icon-192.png', scope).href
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ресурс', {
      body: data.body || '',
      icon,
      badge: icon,
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = (event.notification.data && event.notification.data.url) || '/'
  const base = self.registration.scope
  const target = new URL(String(path).replace(/^\//, ''), base).href
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
    }),
  )
})
