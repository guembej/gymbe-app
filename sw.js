// Service worker de Gymbe App.
// Estrategia: "stale-while-revalidate" para los archivos de la propia app:
//   - se sirve al instante lo que haya en caché (rápido, y funciona sin conexión),
//   - a la vez se pide la versión nueva por red y se guarda para la próxima vez.
// El service worker nuevo se activa SOLO (skipWaiting + clients.claim). Cuando
// toma el control, la app (js/app.js) recarga la página —o muestra un aviso si
// hay un entreno a medias—. Así la actualización nunca se queda a medias.
//
// IMPORTANTE: subir la versión en cada publicación (y ponerla igual en js/version.js).

const CACHE = "gymbe-v1.0.1";

const ARCHIVOS = [
  ".",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "js/version.js",
  "js/datos.js",
  "js/ejemplos.js",
  "js/dialogos.js",
  "js/ejercicios.js",
  "js/rutinas.js",
  "js/entrenar.js",
  "js/historial.js",
  "js/progreso.js",
  "js/tiempo.js",
  "js/aviso-version.js",
  "js/ajustes.js",
  "js/app.js",
  "assets/icono-app.svg",
  "assets/favicon-32.png",
  "assets/icono-192.png",
  "assets/icono-512.png",
  "assets/icono-maskable-512.png",
];

self.addEventListener("install", (evento) => {
  // El SW nuevo NO se queda esperando: precarga los archivos y pasa a activarse.
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Compatibilidad con páginas de versiones anteriores que aún mandan este mensaje.
self.addEventListener("message", (evento) => {
  if (evento.data && evento.data.tipo === "actualizar") self.skipWaiting();
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cacheado = await cache.match(req);

      const desdeRed = fetch(req, { cache: "no-store" })
        .then((respuesta) => {
          if (respuesta && respuesta.ok) cache.put(req, respuesta.clone());
          return respuesta;
        })
        .catch(() => null);

      return cacheado || (await desdeRed) || Response.error();
    })
  );
});
