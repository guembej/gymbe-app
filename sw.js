// Service worker de Gymbe App.
// Estrategia: "stale-while-revalidate" para los archivos de la propia app:
//   - se sirve al instante lo que haya en caché (rápido, y funciona sin conexión),
//   - a la vez se pide la versión nueva por red y se guarda para la próxima vez.
// La actualización NO se aplica sola: la app muestra un aviso y, al pulsar
// "Actualizar", este service worker recibe un mensaje y toma el control.
//
// IMPORTANTE: subir la versión en cada publicación (y ponerla igual en js/version.js).

const CACHE = "gymbe-v1.0";

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
  // No se llama a skipWaiting(): el SW nuevo queda "esperando" hasta que
  // el usuario pulse "Actualizar".
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

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
