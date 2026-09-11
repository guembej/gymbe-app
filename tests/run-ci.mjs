// Corre las comprobaciones automáticas en un navegador headless.
//
//   npm test
//
// Hace dos cosas:
//   1) las pruebas de tests/tests.html (la lógica de la app)
//   2) un "smoke test": abre la app de verdad y falla si suelta CUALQUIER error
//      de consola. Habría cazado varios fallos que se colaron a producción.
//
// La primera vez, instala el navegador:  npx playwright install chromium

import { spawn } from "node:child_process";
import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const servidor = spawn(process.execPath, ["server.js"], { stdio: "ignore" });

async function esperarServidor() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return;
    } catch (e) {
      /* aún no está listo */
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error("El servidor de pruebas no arrancó.");
}

// 1) Pruebas de lógica
async function correrPruebas(navegador) {
  const pagina = await navegador.newPage();
  await pagina.goto(BASE + "/tests/tests.html");
  await pagina.waitForFunction(
    () => document.getElementById("resumen")?.textContent.includes("pasan"),
    { timeout: 15000 }
  );
  const resumen = await pagina.textContent("#resumen");
  const fallos = await pagina.$$eval("#resultados li.fallo", (els) => els.map((e) => e.textContent));
  await pagina.close();
  return { resumen, fallos };
}

// 2) Smoke test: la app arranca sin quejarse
async function correrSmoke(navegador) {
  const contexto = await navegador.newContext();
  const pagina = await contexto.newPage();
  const problemas = [];

  pagina.on("console", (m) => {
    if (m.type() === "error") problemas.push("consola: " + m.text());
  });
  pagina.on("pageerror", (e) => problemas.push("excepción: " + e.message));
  pagina.on("requestfailed", (r) => {
    problemas.push("petición fallida: " + r.url() + " (" + (r.failure()?.errorText || "?") + ")");
  });

  await pagina.goto(BASE + "/", { waitUntil: "load" });
  // dar tiempo al service worker, al splash y al primer pintado
  await pagina.waitForTimeout(2500);

  // comprobaciones mínimas de que la app está viva de verdad
  const estado = await pagina.evaluate(() => ({
    version: typeof APP_VERSION === "string" ? APP_VERSION : null,
    pestanas: document.querySelectorAll(".menu-boton").length,
    seccionVisible: document.querySelector(".seccion:not(.oculta)")?.dataset.seccion || null,
    rutinas: typeof listarRutinas === "function" ? listarRutinas().length : -1,
    // Los iconos son <use href="#ico-...">: si un <symbol> no existe el navegador
    // no da error, solo deja el hueco en blanco. Por eso lo comprobamos aqui.
    iconosRotos: [...document.querySelectorAll('use[href^="#ico-"]')]
      .map((u) => u.getAttribute("href"))
      .filter((id, i, todos) => todos.indexOf(id) === i && !document.querySelector(id)),
    iconosEnMenu: document.querySelectorAll('.menu-boton use[href^="#ico-"]').length,
  }));

  if (!estado.version) problemas.push("la app no ha cargado (APP_VERSION no existe)");
  if (estado.pestanas !== 4) problemas.push("esperaba 4 pestañas y hay " + estado.pestanas);
  if (!estado.seccionVisible) problemas.push("no hay ninguna sección visible");
  if (estado.rutinas <= 0) problemas.push("no se sembraron las rutinas iniciales");
  if (estado.iconosRotos.length > 0)
    problemas.push("iconos sin dibujo: " + estado.iconosRotos.join(", "));
  if (estado.iconosEnMenu !== 4)
    problemas.push("esperaba 4 iconos en el menu y hay " + estado.iconosEnMenu);

  await contexto.close();
  return { problemas, estado };
}

let codigoSalida = 0;

try {
  await esperarServidor();
  const navegador = await chromium.launch();

  const { resumen, fallos } = await correrPruebas(navegador);
  console.log(resumen);
  fallos.forEach((f) => console.log("  FALLO:", f));
  if (fallos.length > 0) codigoSalida = 1;

  const { problemas, estado } = await correrSmoke(navegador);
  if (problemas.length === 0) {
    console.log(`smoke: la app arranca limpia (v${estado.version}, ${estado.pestanas} pestañas, ${estado.rutinas} rutinas)`);
  } else {
    console.log("smoke: PROBLEMAS al arrancar la app");
    problemas.forEach((p) => console.log("  " + p));
    codigoSalida = 1;
  }

  await navegador.close();
} catch (error) {
  console.error(error);
  codigoSalida = 1;
} finally {
  servidor.kill();
}

process.exit(codigoSalida);
