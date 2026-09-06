// ==========================================================
//  Pruebas de Gymbe App
//  Se amplía en cada fase con lo nuevo que se implemente.
// ==========================================================

// Empezar cada prueba con los datos a cero
antesDeCada(_reiniciarDatos);

// ---- Ejercicios ----

prueba("crear un ejercicio lo añade a la lista", () => {
  crearEjercicio({ nombre: "Sentadilla", grupo: "Pierna" });
  igual(listarEjercicios().length, 1);
  igual(listarEjercicios()[0].nombre, "Sentadilla");
});

prueba("el nombre y la nota se guardan sin espacios sobrantes", () => {
  const e = crearEjercicio({ nombre: "  Press  ", grupo: "Pecho", nota: "  suave " });
  igual(e.nombre, "Press");
  igual(e.nota, "suave");
});

prueba("sin grupo, el ejercicio queda como 'Otro'", () => {
  const e = crearEjercicio({ nombre: "Plancha" });
  igual(e.grupo, "Otro");
});

prueba("los ejercicios se listan ordenados por nombre", () => {
  crearEjercicio({ nombre: "Zancada", grupo: "Pierna" });
  crearEjercicio({ nombre: "Abdominal", grupo: "Core" });
  igual(listarEjercicios().map((e) => e.nombre), ["Abdominal", "Zancada"]);
});

prueba("editar un ejercicio cambia sus datos", () => {
  const e = crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  editarEjercicio(e.id, { nombre: "Press militar", grupo: "Hombro", nota: "estricto" });
  const guardado = obtenerEjercicio(e.id);
  igual(guardado.nombre, "Press militar");
  igual(guardado.grupo, "Hombro");
  igual(guardado.nota, "estricto");
});

prueba("borrar un ejercicio lo quita de la lista", () => {
  const e = crearEjercicio({ nombre: "Curl", grupo: "Bíceps" });
  borrarEjercicio(e.id);
  igual(listarEjercicios().length, 0);
});

// ---- Rutinas ----

prueba("crear una rutina sin división guarda cadena vacía y sin ejercicios", () => {
  crearRutina({ nombre: "Día 1" });
  igual(listarRutinas()[0].division, "");
  igual(listarRutinas()[0].items, []);
});

prueba("crear una rutina con división la guarda", () => {
  crearRutina({ nombre: "Día 2", division: "Push" });
  igual(listarRutinas()[0].division, "Push");
});

prueba("editar una rutina cambia nombre y división", () => {
  const r = crearRutina({ nombre: "X", division: "Pull" });
  editarRutina(r.id, { nombre: "Día 3", division: "Pierna" });
  igual(obtenerRutina(r.id).nombre, "Día 3");
  igual(obtenerRutina(r.id).division, "Pierna");
});

prueba("borrar una rutina la quita de la lista", () => {
  const r = crearRutina({ nombre: "Y" });
  borrarRutina(r.id);
  igual(listarRutinas().length, 0);
});

// ---- Ejercicios dentro de una rutina ----

prueba("añadir un ejercicio a una rutina lo guarda con sus datos", () => {
  const e = crearEjercicio({ nombre: "Sentadilla", grupo: "Pierna" });
  const r = crearRutina({ nombre: "Día 1" });
  añadirItemRutina(r.id, {
    exerciseId: e.id, series: 4, reps: "8-12", peso: 60, descansoSeg: 90, nota: "profundo",
  });
  const item = obtenerRutina(r.id).items[0];
  igual(item.exerciseId, e.id);
  igual(item.series, 4);
  igual(item.reps, "8-12");
  igual(item.peso, 60);
  igual(item.descansoSeg, 90);
  igual(item.nota, "profundo");
});

prueba("los números del item se normalizan (series entre 1 y 30, peso ≥ 0)", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 0, peso: -5, descansoSeg: "abc" });
  const item = obtenerRutina(r.id).items[0];
  igual(item.series, 1);
  igual(item.peso, 0);
  igual(item.descansoSeg, 0);
  añadirItemRutina(r.id, { exerciseId: "x", series: 999 });
  igual(obtenerRutina(r.id).items[1].series, 30);
});

prueba("nuevoId no repite aunque se llame muchas veces seguidas", () => {
  const ids = new Set();
  for (let i = 0; i < 500; i++) ids.add(nuevoId());
  igual(ids.size, 500);
});

prueba("editar un item cambia sus datos", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 3 });
  editarItemRutina(r.id, 0, { exerciseId: "x", series: 5, reps: "10", peso: 40, descansoSeg: 60 });
  igual(obtenerRutina(r.id).items[0].series, 5);
  igual(obtenerRutina(r.id).items[0].peso, 40);
});

prueba("quitar un item lo elimina de la rutina", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "a" });
  añadirItemRutina(r.id, { exerciseId: "b" });
  quitarItemRutina(r.id, 0);
  igual(obtenerRutina(r.id).items.length, 1);
  igual(obtenerRutina(r.id).items[0].exerciseId, "b");
});

prueba("mover un item cambia su orden (y no se sale de los límites)", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "a" });
  añadirItemRutina(r.id, { exerciseId: "b" });
  añadirItemRutina(r.id, { exerciseId: "c" });
  moverItemRutina(r.id, 2, -1);
  igual(obtenerRutina(r.id).items.map((i) => i.exerciseId), ["a", "c", "b"]);
  moverItemRutina(r.id, 0, -1);
  igual(obtenerRutina(r.id).items.map((i) => i.exerciseId), ["a", "c", "b"]);
});

// ---- Guardado en el dispositivo ----

prueba("lo creado sigue en el almacenamiento (sobrevive a una recarga)", () => {
  crearEjercicio({ nombre: "Remo", grupo: "Espalda" });
  crearRutina({ nombre: "Día 1", division: "Full Body" });
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.ejercicios[0].nombre, "Remo");
  igual(enDisco.rutinas[0].division, "Full Body");
});

// ---- Entrenamientos ----

prueba("empezar una sesión crea las filas en blanco, guardando el objetivo como referencia", () => {
  const e = crearEjercicio({ nombre: "Sentadilla", grupo: "Pierna" });
  const r = crearRutina({ nombre: "Día 1", division: "Pierna" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 3, reps: "8-10", peso: 80, descansoSeg: 120 });
  empezarSesion(r.id);
  const s = sesionActiva();
  esVerdad(s, "debería haber una sesión activa");
  igual(s.routineNombre, "Día 1");
  igual(s.division, "Pierna");
  igual(s.ejercicios[0].filas.length, 3);
  igual(s.ejercicios[0].filas[0].pesoReal, "");
  igual(s.ejercicios[0].filas[0].repsReal, "");
  igual(s.ejercicios[0].filas[0].hecha, false);
  // el objetivo se conserva para mostrarlo
  igual(s.ejercicios[0].objetivo.peso, 80);
  igual(s.ejercicios[0].objetivo.reps, "8-10");
});

prueba("la sesión en curso se guarda en el almacenamiento", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 1 });
  empezarSesion(r.id);
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.sesionActiva.routineId, r.id);
});

prueba("descartar la sesión la deja en null", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 1 });
  empezarSesion(r.id);
  descartarSesionActiva();
  igual(sesionActiva(), null);
});

prueba("terminar guarda solo las series marcadas como hechas y limpia la activa", () => {
  const e = crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 3, reps: "10", peso: 50 });
  empezarSesion(r.id);
  const s = sesionActiva();
  s.ejercicios[0].filas[0].hecha = true;
  s.ejercicios[0].filas[0].pesoReal = "52.5";
  s.ejercicios[0].filas[0].repsReal = "9";
  s.ejercicios[0].filas[2].hecha = true;
  const guardada = terminarSesion();
  igual(guardada.sets.length, 2);
  igual(guardada.sets[0].pesoReal, 52.5);
  igual(guardada.sets[0].repsReal, "9");
  igual(guardada.sets[0].serie, 1);
  igual(guardada.sets[1].serie, 3);
  igual(sesionActiva(), null);
  igual(listarSesiones().length, 1);
});

prueba("la sesión guardada conserva nombre y división aunque se borre la rutina", () => {
  const r = crearRutina({ nombre: "Día X", division: "Push" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 1 });
  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0].hecha = true;
  terminarSesion();
  borrarRutina(r.id);
  igual(listarSesiones()[0].routineNombre, "Día X");
  igual(listarSesiones()[0].division, "Push");
});

prueba("listarSesiones ordena de más reciente a más antigua", () => {
  DATOS.sesiones.push({ id: "a", fecha: "2026-01-01T10:00:00.000Z", sets: [] });
  DATOS.sesiones.push({ id: "b", fecha: "2026-03-01T10:00:00.000Z", sets: [] });
  DATOS.sesiones.push({ id: "c", fecha: "2026-02-01T10:00:00.000Z", sets: [] });
  igual(listarSesiones().map((s) => s.id), ["b", "c", "a"]);
});

prueba("progresoDeEjercicio calcula pesoMax, volumen y 1RM por sesión, en orden", () => {
  const e = crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 2, reps: "8", peso: 50 });

  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0] = { pesoReal: "50", repsReal: "8", hecha: true };
  sesionActiva().ejercicios[0].filas[1] = { pesoReal: "50", repsReal: "6", hecha: true };
  const g1 = terminarSesion();
  g1.fecha = "2026-01-01T10:00:00.000Z";
  guardar();

  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0] = { pesoReal: "55", repsReal: "8", hecha: true };
  sesionActiva().ejercicios[0].filas[1] = { pesoReal: "55", repsReal: "5", hecha: true };
  const g2 = terminarSesion();
  g2.fecha = "2026-02-01T10:00:00.000Z";
  guardar();

  const p = progresoDeEjercicio(e.id);
  igual(p.length, 2);
  igual(p[0].pesoMax, 50);
  igual(p[0].volumen, 50 * 8 + 50 * 6); // 700
  igual(p[1].pesoMax, 55);
  igual(p[1].volumen, 55 * 8 + 55 * 5); // 715
  esVerdad(Math.abs(p[1].rm - 55 * (1 + 8 / 30)) < 0.05, "1RM Epley de la mejor serie");
});

prueba("progresoDeEjercicio devuelve vacío si el ejercicio no tiene historial", () => {
  const e = crearEjercicio({ nombre: "Nuevo", grupo: "Otro" });
  igual(progresoDeEjercicio(e.id).length, 0);
});

prueba("marcasEjeY: 5+ marcas enteras con paso bonito (rango pequeño)", () => {
  const eje = marcasEjeY(52.5, 60);
  esVerdad(eje.marcas.length >= 5, "al menos 5 marcas");
  eje.marcas.forEach((v) => igual(v, Math.round(v)));
  esVerdad(eje.marcas[0] <= 52.5 && eje.marcas[eje.marcas.length - 1] >= 60, "cubre los datos");
  const paso = eje.marcas[1] - eje.marcas[0];
  esVerdad([1, 2, 5, 10, 20, 25, 50].includes(paso), "paso bonito: " + paso);
});

prueba("indicesEtiquetasX: todos si son pocos, repartidos si son muchos", () => {
  igual(indicesEtiquetasX(4, 6), [0, 1, 2, 3]);
  const muchos = indicesEtiquetasX(15, 6);
  igual(muchos[0], 0);
  igual(muchos[muchos.length - 1], 14);
  esVerdad(muchos.length <= 6);
  // ordenados y sin repetidos
  igual([...new Set(muchos)].sort((a, b) => a - b), muchos);
});

prueba("marcasEjeY: valores iguales y rango grande no rompen", () => {
  const a = marcasEjeY(60, 60);
  esVerdad(a.marcas.length >= 5 && a.max > a.min);

  const b = marcasEjeY(1470, 1680);
  esVerdad(b.marcas.length >= 5);
  b.marcas.forEach((v) => igual(v, Math.round(v)));
});

prueba("obtenerSesion y borrarSesion funcionan sobre el historial", () => {
  const e = crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 2, reps: "10", peso: 50 });
  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0].hecha = true;
  const guardada = terminarSesion();

  esVerdad(obtenerSesion(guardada.id), "la sesión debería existir en el historial");
  borrarSesion(guardada.id);
  igual(obtenerSesion(guardada.id), null);
  igual(listarSesiones().length, 0);
});

// ---- Datos de ejemplo ----

prueba("cargarDatosEjemplo crea las rutinas iniciales con sus ejercicios", () => {
  const r = cargarDatosEjemplo();
  esVerdad(r.rutinasAñadidas >= 3, "debería añadir al menos 3 rutinas");
  igual(listarRutinas().length, r.rutinasAñadidas);
  const empuje = listarRutinas().find((x) => x.nombre === "Empuje A - Gym");
  esVerdad(empuje, "debería existir la rutina «Empuje A - Gym»");
  igual(empuje.division, "Push");
  esVerdad(empuje.items.length >= 4, "«Empuje A - Gym» debería tener varios ejercicios");
  esVerdad(obtenerEjercicio(empuje.items[0].exerciseId), "el item apunta a un ejercicio real");
  igual(empuje.items[0].reps, "6-8", "reps de la primera serie");
  igual(empuje.items[0].descansoSeg, 150, "descanso en segundos");
});

prueba("cargarDatosEjemplo NO crea historial (Progreso empieza de cero)", () => {
  cargarDatosEjemplo();
  igual(listarSesiones().length, 0);
});

prueba("cargarDatosEjemplo no duplica si se llama otra vez", () => {
  cargarDatosEjemplo();
  const rutinasAntes = listarRutinas().length;
  const ejerciciosAntes = listarEjercicios().length;
  const r2 = cargarDatosEjemplo();
  igual(r2.rutinasAñadidas, 0);
  igual(listarRutinas().length, rutinasAntes);
  igual(listarEjercicios().length, ejerciciosAntes);
});

prueba("borrarTodosLosDatos deja todo vacío", () => {
  cargarDatosEjemplo();
  borrarTodosLosDatos();
  igual(listarRutinas().length, 0);
  igual(listarEjercicios().length, 0);
  igual(listarSesiones().length, 0);
  igual(sesionActiva(), null);
});

// ---- Exportar / importar ----

prueba("exportarDatos incluye los datos y las opciones, no el entreno en curso", () => {
  crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  crearRutina({ nombre: "D", division: "Push" });
  const obj = JSON.parse(exportarDatos());
  igual(obj.ejercicios.length, 1);
  igual(obj.rutinas.length, 1);
  esVerdad(obj.prefs && obj.temporizador, "incluye opciones y temporizador");
  igual(obj.sesionActiva, undefined);
});

prueba("importarDatos reemplaza todo con una copia válida", () => {
  crearEjercicio({ nombre: "Viejo", grupo: "Otro" });
  const copia = JSON.stringify({
    version: "gym.datos.v1",
    ejercicios: [{ id: "a", nombre: "Nuevo", grupo: "Pecho", nota: "" }],
    rutinas: [],
    sesiones: [],
  });
  igual(importarDatos(copia).ok, true);
  igual(listarEjercicios().length, 1);
  igual(listarEjercicios()[0].nombre, "Nuevo");
});

prueba("importarDatos rechaza archivos inválidos sin tocar los datos", () => {
  crearEjercicio({ nombre: "Importante", grupo: "Otro" });
  igual(importarDatos("esto no es json {{{").ok, false);
  igual(importarDatos(JSON.stringify({ cualquier: "cosa" })).ok, false);
  igual(listarEjercicios().length, 1); // sigue ahí
});

prueba("exportar e importar: ida y vuelta conserva rutinas, items y opciones", () => {
  const r = crearRutina({ nombre: "Pierna", division: "Pierna" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 4, reps: "5", peso: 100 });
  guardarPref("sonido", false);
  const copia = exportarDatos();

  _reiniciarDatos();
  igual(listarRutinas().length, 0);

  importarDatos(copia);
  igual(listarRutinas().length, 1);
  igual(obtenerRutina(listarRutinas()[0].id).items[0].peso, 100);
  igual(obtenerPref("sonido"), false);
});

prueba("temaEfectivo respeta la preferencia guardada", () => {
  guardarPref("tema", "claro");
  igual(temaEfectivo(), "claro");
  guardarPref("tema", "oscuro");
  igual(temaEfectivo(), "oscuro");
});

// ---- Utilidades ----

prueba("escaparHtml neutraliza etiquetas HTML", () => {
  igual(escaparHtml("<b>hola</b>"), "&lt;b&gt;hola&lt;/b&gt;");
});

// ---- Tiempo y preferencias ----

prueba("formatearCronometro: MM:SS y, con décimas, MM:SS.d", () => {
  igual(formatearCronometro(0, false), "00:00");
  igual(formatearCronometro(65000, false), "01:05");
  igual(formatearCronometro(65400, true), "01:05.4");
  igual(formatearCronometro(600000, false), "10:00");
});

prueba("formatearCuentaAtras redondea hacia arriba y no baja de 0", () => {
  igual(formatearCuentaAtras(90), "1:30");
  igual(formatearCuentaAtras(5.2), "0:06");
  igual(formatearCuentaAtras(0), "0:00");
  igual(formatearCuentaAtras(-3), "0:00");
});

prueba("construirSegmentos: prep + (serie, descanso) x N, sin el último descanso", () => {
  const s = construirSegmentos({ prepSeg: 10, serieSeg: 30, descansoSeg: 90, numSeries: 3 });
  igual(s.map((x) => x.fase), ["prep", "serie", "descanso", "serie", "descanso", "serie"]);
  igual(s[0].seg, 10);
  igual(s[2].seg, 90);
  igual(s[s.length - 1].serie, 3);
});

prueba("construirSegmentos: sin preparación y con 1 serie es solo la serie", () => {
  const s = construirSegmentos({ prepSeg: 0, serieSeg: 30, descansoSeg: 90, numSeries: 1 });
  igual(s.map((x) => x.fase), ["serie"]);
});

prueba("obtenerTempConfig / guardarTempConfig conservan las demás claves", () => {
  igual(obtenerTempConfig().numSeries, 4);
  igual(obtenerTempConfig().prepSeg, 5);
  guardarTempConfig({ numSeries: 6, descansoSeg: 120 });
  igual(obtenerTempConfig().numSeries, 6);
  igual(obtenerTempConfig().descansoSeg, 120);
  igual(obtenerTempConfig().prepSeg, 5);
});

prueba("las preferencias se guardan sin perder las demás", () => {
  igual(obtenerPref("sonido"), true);
  igual(obtenerPref("cronDecimas"), false);
  guardarPref("sonido", false);
  igual(obtenerPref("sonido"), false);
  igual(obtenerPref("vibracion"), true);
  // se conserva al releer del almacenamiento
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.prefs.sonido, false);
});

// ---- Registro simple (una fila por ejercicio en Entrenar) ----

prueba("registroSimple desactivado: una fila por serie del objetivo", () => {
  const e = crearEjercicio({ nombre: "Press banca", grupo: "Pecho" });
  const r = crearRutina({ nombre: "Push", division: "Push" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 4, reps: "8-10", peso: 60 });
  igual(obtenerPref("registroSimple"), false);
  empezarSesion(r.id);
  igual(sesionActiva().ejercicios[0].filas.length, 4);
});

prueba("registroSimple activado: una sola fila por ejercicio, sea cual sea el objetivo", () => {
  const e = crearEjercicio({ nombre: "Press banca", grupo: "Pecho" });
  const r = crearRutina({ nombre: "Push", division: "Push" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 4, reps: "8-10", peso: 60 });
  guardarPref("registroSimple", true);
  empezarSesion(r.id);
  const ej = sesionActiva().ejercicios[0];
  igual(ej.filas.length, 1);
  igual(ej.objetivo.series, 4, "el objetivo sigue mostrando las 4 series");
});

// ---- Barra "Versión nueva disponible" ----

prueba("manejarClicActualizar oculta la barra, avisa al SW y programa la recarga", () => {
  const barra = { hidden: false };
  let mensaje = null;
  let recargado = false;
  manejarClicActualizar(
    barra,
    { postMessage: (m) => { mensaje = m; } },
    () => { recargado = true; },
    (fn) => fn() // "programar" síncrono para la prueba
  );
  igual(barra.hidden, true, "la barra debe ocultarse al instante");
  igual(mensaje, { tipo: "actualizar" }, "se avisa al service worker en espera");
  esVerdad(recargado, "se programa la recarga de seguridad");
});

prueba("manejarClicActualizar no falla si no hay service worker en espera", () => {
  const barra = { hidden: false };
  manejarClicActualizar(barra, null, () => {}, (fn) => fn());
  igual(barra.hidden, true);
});
