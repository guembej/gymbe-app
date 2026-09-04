// Corre las pruebas de tests/tests.html en un navegador headless.
//
//   npm test
//
// La primera vez, instala el navegador:  npx playwright install chromium

import { spawn } from "node:child_process";
import { chromium } from "playwright";

const servidor = spawn(process.execPath, ["server.js"], { stdio: "ignore" });

async function esperarServidor() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch("http://localhost:5173/");
      if (r.ok) return;
    } catch (e) {
      /* aún no está listo */
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error("El servidor de pruebas no arrancó.");
}

let codigoSalida = 0;

try {
  await esperarServidor();

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto("http://localhost:5173/tests/tests.html");
  await pagina.waitForFunction(
    () => document.getElementById("resumen")?.textContent.includes("pasan"),
    { timeout: 15000 }
  );

  const resumen = await pagina.textContent("#resumen");
  const fallos = await pagina.$$eval("#resultados li.fallo", (els) =>
    els.map((e) => e.textContent)
  );

  console.log(resumen);
  fallos.forEach((f) => console.log("  FALLO:", f));

  if (fallos.length > 0) codigoSalida = 1;
  await navegador.close();
} catch (error) {
  console.error(error);
  codigoSalida = 1;
} finally {
  servidor.kill();
}

process.exit(codigoSalida);
