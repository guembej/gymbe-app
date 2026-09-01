// Servidor local para probar la app en el navegador.
// No hace falta internet ni instalar nada: usa solo Node.
// Arrancar con:  node server.js
// Luego abrir:   http://localhost:5173

const http = require("http");
const fs = require("fs");
const path = require("path");

const PUERTO = 5173;
const RAIZ = __dirname;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

const servidor = http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index.html";

  const archivo = path.join(RAIZ, path.normalize(ruta));
  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }

  fs.readFile(archivo, (err, datos) => {
    if (err) {
      res.writeHead(404);
      return res.end("No encontrado: " + ruta);
    }
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo });
    res.end(datos);
  });
});

servidor.listen(PUERTO, () => {
  console.log(`App en marcha:  http://localhost:${PUERTO}`);
  console.log("Para pararlo: Ctrl + C");
});
