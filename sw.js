// Имя кэша. Меняй версию (v1, v2, v3...), когда обновляешь файлы приложения.
const CACHE_NAME = 'calculator-pwa-v1';

// Список файлов, которые нужно закэшировать ("оболочка" приложения).
const FILES_TO_CACHE = [
  './', // Главная страница (index.html)
  './manifest.json',
  './icon/128.PNG',
  './icon/192.PNG',
  './icon/512.PNG',
  // Ссылки на твои внешние библиотеки
  'https://jen9-ops.github.io/library/script.js',
  'https://jen9-ops.github.io/library/style.css'
];

// --- ЭТАП 1: УСТАНОВКА (INSTALL) ---
// Срабатывает при первой установке Service Worker.
// Здесь мы кэшируем все основные файлы приложения.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Установка...');
  // Ждём, пока все файлы не будут успешно закэшированы.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Кэширование оболочки приложения');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// --- ЭТАП 2: АКТИВАЦИЯ (ACTIVATE) ---
// Срабатывает после установки.
// Здесь мы удаляем старые кэши, чтобы приложение не использовало устаревшие файлы.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Активация...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Если имя кэша не совпадает с текущим, удаляем его.
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Удаление старого кэша', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Активируем новый Service Worker немедленно.
  return self.clients.claim();
});

// --- ЭТАП 3: ПЕРЕХВАТ ЗАПРОСОВ (FETCH) ---
// Срабатывает каждый раз, когда приложение запрашивает какой-либо ресурс (страницу, скрипт, картинку).
// Здесь реализуется стратегия кэширования.
self.addEventListener('fetch', (event) => {
  // Мы применяем стратегию только для GET-запросов.
  if (event.request.method !== 'GET') {
    return;
  }

  // Применяем стратегию "Stale-While-Revalidate"
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // 1. Пытаемся получить свежие данные из сети
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Если получили, кладём их в кэш для будущих запросов
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // 2. Возвращаем либо кэшированный ответ (если он есть), либо ждём ответа от сети
        return cachedResponse || fetchPromise;
      });
    })
  );
});
