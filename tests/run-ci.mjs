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
    // Ajustes se monta en el HTML y se engancha desde ajustes.js por id: si se
    // renombra o se pierde un id al retocar el maquetado, la preferencia deja
    // de guardarse sin dar ningun error.
    ajustesSueltos: ["pref-sonido", "pref-vibracion", "pref-registrosimple",
                     "pref-crondecimas", "btn-exportar", "btn-importar",
                     "input-importar", "btn-borrar-todo", "pie-version"]
      .filter((id) => !document.getElementById(id)),
    botonesTema: document.querySelectorAll(".conmutador-tema [data-tema]").length,
    botonesVolumen: document.querySelectorAll(".conmutador-volumen [data-volumen]").length,
    botonesMedida: document.querySelectorAll(".conmutador-medida [data-medida]").length,
    // Progreso: el desplegable paso a ser un campo de busqueda (v1.13.0). Si
    // vuelve a ser un <select>, progreso.js deja de engancharle el buscador.
    progresoEsSelect: document.getElementById("progreso-ejercicio")?.tagName !== "INPUT",
    progresoSinLista: !document.getElementById("progreso-sugerencias"),
    // El cambio de ejercicio se engancha por id desde entrenar.js
    cambioSuelto: ["dialogo-elegir", "elegir-busca", "elegir-sugerencias",
                   "elegir-titulo", "elegir-explica", "elegir-cancelar",
                   "btn-anadir-ejercicio"]
      .filter((id) => !document.getElementById(id)),
    // La casilla de "serie hecha" se quito en la v1.8.0: una serie cuenta si
    // tiene repeticiones. Si vuelve a aparecer, es que se ha revertido algo.
    casillasDeSerie: document.querySelectorAll('.serie-fila input[type="checkbox"]').length,
  }));

  // El panel del entreno solo existe con un entreno en curso, asi que se arranca
  // uno de mentira para poder mirarlo. Los iconos de "+", "cambiar" y
  // "temporizador" no se pintan en ningun otro sitio: sin esto, un <symbol> que
  // falte no lo ve nadie hasta estar en el gimnasio.
  const entreno = await pagina.evaluate(() => {
    empezarSesion(listarRutinas()[0].id);
    mostrarPanelEntreno();
    const bloques = [...document.querySelectorAll("#activo-ejercicios .bloque-ejercicio")];
    const r = {
      bloques: bloques.length,
      sinBotonCambiar: bloques.filter((b) => !b.querySelector(".bloque-cabecera [data-cambiar]")).length,
      piesMalos: bloques.filter((b) => b.querySelectorAll(".bloque-pie .accion-serie").length !== 2).length,
      // la fila de cabeceras se quito: la unidad va dentro de cada campo
      cabecerasViejas: document.querySelectorAll(".serie-cabecera").length,
      sinPlaceholder: [...document.querySelectorAll("#activo-ejercicios .serie-fila input")]
        .filter((i) => !i.placeholder).length,
      iconosRotos: [...document.querySelectorAll('#activo-ejercicios use[href^="#ico-"]')]
        .map((u) => u.getAttribute("href"))
        .filter((id, i, todos) => todos.indexOf(id) === i && !document.querySelector(id)),
      // el numero de serie va en un circulo que se rellena al anotarla
      numerosCuadrados: [...document.querySelectorAll(".serie-num")]
        .filter((n) => !getComputedStyle(n).borderRadius.startsWith("50")).length,
      // el descanso se marca con el reloj, no con la palabra "descanso"
      // ojo: la clase .objetivo se reutiliza como "texto gris pequeno" en el
      // historial y en el temporizador, asi que hay que acotar al panel.
      objetivosConLaPalabra: [...document.querySelectorAll("#activo-ejercicios .objetivo")]
        .filter((o) => /descanso/i.test(o.textContent)).length,
      objetivosSinReloj: [...document.querySelectorAll("#activo-ejercicios .objetivo")]
        .filter((o) => !o.querySelector('use[href="#ico-tiempo"]')).length,
    };
    // dejar el panel como estaba: el entreno de mentira no debe ensuciar las
    // comprobaciones siguientes
    descartarSesionActiva();
    renderEntrenar();
    window.scrollTo(0, 0);
    return r;
  });

  // El logo lleva al inicio SIN recargar. Si vuelve a recargar siempre, el gesto
  // pasa de 2 ms a mas de un segundo y nadie se entera mirando la pantalla.
  // (No se prueba el segundo toque: recargaria la pagina y tumbaria el smoke.)
  // Si el logo recarga, la pagina navega y Playwright revienta con un
  // "Execution context was destroyed". Se atrapa aqui para que el fallo se lea.
  let logo;
  try {
    logo = await pagina.evaluate(async () => {
      const boton = document.getElementById("btn-inicio");
      const r = { alAbrir: yaEnElInicio() };
      irA("progreso");
      window.scrollTo(0, 300);
      r.enOtraPestana = yaEnElInicio();

      // Testigo: tras una recarga, la app TAMBIEN acaba en Entrenar, arriba y con
      // las rutinas pintadas, asi que mirar el resultado no distingue los dos
      // caminos. Esta marca solo sobrevive si NO se recargo.
      window.__sinRecargar = true;
      boton.click();
      await new Promise((res) => setTimeout(res, 300));

      r.noRecargo = window.__sinRecargar === true;
      r.seccionTrasElLogo = document.querySelector(".seccion:not(.oculta)")?.dataset.seccion;
      r.scrollTrasElLogo = Math.round(window.scrollY);
      return r;
    });
  } catch (e) {
    // "Execution context was destroyed" = la pagina navego, o sea que el logo
    // recargo. Se espera a que vuelva para que no se lleve por delante las
    // comprobaciones siguientes.
    logo = { recargo: true, error: String(e.message || e).slice(0, 60) };
    await pagina.waitForLoadState("load").catch(() => {});
    await pagina.waitForTimeout(2000);
  }

  // Progreso: la lista NO debe llevar tope. El buscador es compartido y el tope
  // existe para los dialogos, donde la lista flota encima de un formulario; aqui
  // solo tapa la grafica. Con tope solo se veian 12 de 47 ejercicios.
  const progreso = await pagina.evaluate(() => {
    renderProgreso();
    const campo = document.getElementById("progreso-ejercicio");
    campo.value = "";
    campo.dispatchEvent(new Event("focus"));
    const enBlanco = document.querySelectorAll("#progreso-sugerencias .sugerencia").length;
    return { enBlanco, ejercicios: listarEjercicios().length };
  });

  // El boton de ventana flotante del cronometro sale SOLO tras pulsar "Empezar".
  // Si se pintara siempre, sacaria una ventanita con 00:00 clavado; si no se
  // pintara nunca, la funcion no existiria para nadie y nadie lo notaria.
  const cronoPip = await pagina.evaluate(() => {
    const boton = document.getElementById("crono-flotante");
    if (!boton) return { falta: true };
    document.getElementById("crono-reset").click();
    const alPrincipio = boton.hidden;
    document.getElementById("crono-toggle").click();
    const alEmpezar = boton.hidden;
    const dibuja = typeof dibujarCronoPiP === "function";
    document.getElementById("crono-reset").click();
    return { falta: false, alPrincipio, alEmpezar, alReiniciar: boton.hidden, dibuja };
  });

  if (!estado.version) problemas.push("la app no ha cargado (APP_VERSION no existe)");
  if (estado.pestanas !== 4) problemas.push("esperaba 4 pestañas y hay " + estado.pestanas);
  if (!estado.seccionVisible) problemas.push("no hay ninguna sección visible");
  if (estado.rutinas <= 0) problemas.push("no se sembraron las rutinas iniciales");
  if (estado.iconosRotos.length > 0)
    problemas.push("iconos sin dibujo: " + estado.iconosRotos.join(", "));
  if (estado.iconosEnMenu !== 4)
    problemas.push("esperaba 4 iconos en el menu y hay " + estado.iconosEnMenu);
  if (estado.ajustesSueltos.length > 0)
    problemas.push("faltan elementos de Ajustes: " + estado.ajustesSueltos.join(", "));
  if (estado.botonesTema !== 3)
    problemas.push("esperaba 3 botones de tema y hay " + estado.botonesTema);
  if (estado.botonesVolumen !== 3)
    problemas.push("esperaba 3 botones de volumen y hay " + estado.botonesVolumen);
  if (estado.botonesMedida !== 2)
    problemas.push("esperaba 2 botones de 'se mide en' y hay " + estado.botonesMedida);
  if (estado.progresoEsSelect)
    problemas.push("el selector de Progreso ya no es un campo de busqueda");
  if (estado.progresoSinLista)
    problemas.push("falta la lista de coincidencias de Progreso");
  if (!logo.recargo && !logo.alAbrir) problemas.push("recien abierta, la app no se considera 'en el inicio'");
  if (!logo.recargo && logo.enOtraPestana) problemas.push("en otra pestana no deberia considerarse 'en el inicio'");
  if (!logo.recargo && logo.seccionTrasElLogo !== "entrenar")
    problemas.push("el logo no lleva a Entrenar, deja " + logo.seccionTrasElLogo);
  if (!logo.recargo && logo.scrollTrasElLogo !== 0) problemas.push("el logo no sube arriba del todo");
  if (logo.recargo || !logo.noRecargo)
    problemas.push("el logo RECARGO la pagina en vez de ir al inicio (1143 ms frente a 2 ms)");

  if (progreso.enBlanco !== progreso.ejercicios)
    problemas.push(`el filtro de Progreso en blanco ensena ${progreso.enBlanco} de ` +
                   `${progreso.ejercicios} ejercicios: no deberia llevar tope`);
  if (estado.cambioSuelto.length > 0)
    problemas.push("faltan elementos de elegir/anadir ejercicio: " + estado.cambioSuelto.join(", "));
  if (estado.casillasDeSerie > 0)
    problemas.push("han vuelto las casillas de serie hecha: " + estado.casillasDeSerie);

  if (cronoPip.falta) problemas.push("falta el boton de ventana flotante del cronometro");
  else {
    if (!cronoPip.alPrincipio) problemas.push("la ventana flotante del cronometro se ofrece con el cronometro a cero");
    if (cronoPip.alEmpezar) problemas.push("tras 'Empezar' no aparece la ventana flotante del cronometro");
    if (!cronoPip.alReiniciar) problemas.push("tras 'Reiniciar' sigue el boton de ventana flotante del cronometro");
    if (!cronoPip.dibuja) problemas.push("no existe dibujarCronoPiP(): la ventanita pintaria el temporizador");
  }

  if (entreno.bloques === 0) problemas.push("el panel del entreno no pinta ningun ejercicio");
  if (entreno.sinBotonCambiar > 0)
    problemas.push(entreno.sinBotonCambiar + " ejercicios sin el boton de cambiar ejercicio");
  if (entreno.piesMalos > 0)
    problemas.push(entreno.piesMalos + " ejercicios sin sus 2 acciones de serie (+ y temporizador)");
  if (entreno.cabecerasViejas > 0)
    problemas.push("ha vuelto la fila de cabeceras # PESO REPS");
  if (entreno.sinPlaceholder > 0)
    problemas.push(entreno.sinPlaceholder + " campos de serie sin su unidad (kg / reps / seg)");
  if (entreno.iconosRotos.length > 0)
    problemas.push("iconos sin dibujo en el entreno: " + entreno.iconosRotos.join(", "));
  if (entreno.numerosCuadrados > 0)
    problemas.push(entreno.numerosCuadrados + " numeros de serie sin su circulo");
  if (entreno.objetivosConLaPalabra > 0)
    problemas.push("ha vuelto la palabra 'descanso' al objetivo");
  if (entreno.objetivosSinReloj > 0)
    problemas.push(entreno.objetivosSinReloj + " objetivos sin el reloj del descanso");

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
