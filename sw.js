// Service worker de Gymbe App.
// Estrategia: "stale-while-revalidate" para los archivos de la propia app:
//   - se sirve al instante lo que haya en caché (rápido, y funciona sin conexión),
//   - a la vez se pide la versión nueva por red y se guarda para la próxima vez.
// Así, tras publicar cambios, la app se actualiza sola en la siguiente apertura.

const CACHE = "gymbe-v4";

const ARCHIVOS = [
  ".",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "js/datos.js",
  "js/ejemplos.js",
  "js/dialogos.js",
  "js/ejercicios.js",
  "js/rutinas.js",
  "js/entrenar.js",
  "js/historial.js",
  "js/progreso.js",
  "js/tiempo.js",
  "js/ajustes.js",
  "js/app.js",
  "assets/icono-app.svg",
  "assets/favicon-32.png",
  "assets/icono-192.png",
  "assets/icono-512.png",
  "assets/icono-maskable-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
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

      // Si hay copia en caché, se devuelve ya (y la red actualiza por detrás).
      // Si no, se espera a la red.
      return cacheado || (await desdeRed) || Response.error();
    })
  );
});
