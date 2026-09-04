// Service worker de Gymbe App.
// Guarda toda la app para que funcione sin conexión y cargue al instante.
// Al cambiar archivos, sube el número de versión para renovar la caché.

const CACHE = "gymbe-v1";

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
  if (evento.request.method !== "GET") return;

  evento.respondWith(
    caches.match(evento.request).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(evento.request)
        .then((respuesta) => {
          if (respuesta.ok && evento.request.url.startsWith(self.location.origin)) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(evento.request, copia));
          }
          return respuesta;
        })
        .catch(() => cacheado); // sin conexión y sin copia en caché
    })
  );
});
