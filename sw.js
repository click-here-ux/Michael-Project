const CACHE_NAME = 'medagenda-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/agendar.html',
    '/perfil.html',
    '/medico.html',
    '/css/style.css',
    '/js/supabase-config.js',
    '/js/auth.js',
    '/js/consultas.js',
    '/js/dashboard.js',
    '/js/agendar.js',
    '/js/perfil.js',
    '/js/medico.js',
    '/manifest.json'
];

// Instalar — guardar assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativar — limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — cache first, depois rede
self.addEventListener('fetch', (event) => {
    // Não cachear requests à API do Supabase
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Guardar cópia no cache
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        }).catch(() => {
            // Fallback offline — mostrar index
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
