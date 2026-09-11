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

prueba("_sinTildes quita tildes y diéresis (el buscador depende de esto)", () => {
  igual(_sinTildes("Extensión"), "extension");
  igual(_sinTildes("TRÍCEPS"), "triceps");
  igual(_sinTildes("Pájaros"), "pajaros");
  igual(_sinTildes("Bíceps"), "biceps");
  igual(_sinTildes(""), "");
  igual(_sinTildes(null), "");
});

prueba("filtrarEjercicios encuentra por trozo de nombre ignorando mayúsculas y tildes", () => {
  crearEjercicio({ nombre: "Press banca", grupo: "Pecho" });
  crearEjercicio({ nombre: "Press militar", grupo: "Hombro" });
  crearEjercicio({ nombre: "Extensión de tríceps", grupo: "Tríceps" });

  igual(filtrarEjercicios("press").coincidencias.map((e) => e.nombre), ["Press banca", "Press militar"]);
  igual(filtrarEjercicios("EXTENSION DE TRICEPS").coincidencias.map((e) => e.nombre), ["Extensión de tríceps"]);
  igual(filtrarEjercicios("  ").coincidencias.length, 0);
});

prueba("filtrarEjercicios: hayExacto solo cuando el nombre coincide entero", () => {
  crearEjercicio({ nombre: "Press banca", grupo: "Pecho" });
  esVerdad(filtrarEjercicios("press banca").hayExacto);
  esVerdad(filtrarEjercicios("PRESS BANCA").hayExacto);
  esVerdad(!filtrarEjercicios("press").hayExacto, "un trozo no es coincidencia exacta");
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

prueba("crearRutina recorta los espacios del nombre", () => {
  igual(crearRutina({ nombre: "  Día 1  " }).nombre, "Día 1");
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

prueba("el item recorta espacios en reps y nota", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 3, reps: "  8-12 ", nota: "  bajar despacio " });
  const item = obtenerRutina(r.id).items[0];
  igual(item.reps, "8-12");
  igual(item.nota, "bajar despacio");
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

prueba("reordenarItem coloca el ejercicio en la posición destino (arrastrar y soltar)", () => {
  const r = crearRutina({ nombre: "D" });
  ["a", "b", "c", "d"].forEach((x) => añadirItemRutina(r.id, { exerciseId: x }));
  reordenarItem(r.id, 0, 2); // 'a' pasa a la posición 2
  igual(obtenerRutina(r.id).items.map((i) => i.exerciseId), ["b", "c", "a", "d"]);
  reordenarItem(r.id, 3, 0); // 'd' pasa al principio
  igual(obtenerRutina(r.id).items.map((i) => i.exerciseId), ["d", "b", "c", "a"]);
});

prueba("reordenarItem ignora índices inválidos o iguales", () => {
  const r = crearRutina({ nombre: "D" });
  ["a", "b", "c"].forEach((x) => añadirItemRutina(r.id, { exerciseId: x }));
  reordenarItem(r.id, 1, 1);
  reordenarItem(r.id, 0, 9);
  reordenarItem(r.id, -1, 0);
  igual(obtenerRutina(r.id).items.map((i) => i.exerciseId), ["a", "b", "c"]);
});

// ---- Guardado en el dispositivo ----

prueba("lo creado sigue en el almacenamiento (sobrevive a una recarga)", () => {
  crearEjercicio({ nombre: "Remo", grupo: "Espalda" });
  crearRutina({ nombre: "Día 1", division: "Full Body" });
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.ejercicios[0].nombre, "Remo");
  igual(enDisco.rutinas[0].division, "Full Body");
});

prueba("cargar rellena las opciones y el temporizador que falten en datos antiguos", () => {
  // datos de una versión vieja: prefs y temporizador incompletos
  localStorage.setItem(window.GYM_CLAVE_ALMACEN, JSON.stringify({
    ejercicios: [{ id: "a", nombre: "Press", grupo: "Pecho", nota: "" }],
    rutinas: [], sesiones: [],
    prefs: { tema: "claro", sonido: false },
    temporizador: { numSeries: 8 },
  }));
  DATOS = cargar();
  // lo que ya había se respeta
  igual(DATOS.prefs.tema, "claro");
  igual(DATOS.prefs.sonido, false);
  igual(DATOS.temporizador.numSeries, 8);
  igual(DATOS.ejercicios.length, 1);
  // lo que faltaba se rellena con el valor por defecto
  igual(DATOS.prefs.grupoPorDefecto, "Otro");
  igual(DATOS.prefs.registroSimple, false);
  igual(DATOS.prefs.vibracion, true);
  igual(DATOS.temporizador.prepSeg, 5);
  igual(DATOS.temporizador.descansoSeg, 90);
});

prueba("guardar() no revienta si el almacenamiento está lleno: devuelve false", () => {
  const original = localStorage.setItem;
  localStorage.setItem = function () {
    throw new DOMException("almacén lleno", "QuotaExceededError");
  };
  let lanzo = false;
  let resultado = null;
  try {
    resultado = guardar();
  } catch (e) {
    lanzo = true;
  } finally {
    localStorage.setItem = original;
  }
  esVerdad(!lanzo, "guardar() NO debe propagar la excepción (rompería toda la app)");
  igual(resultado, false, "devuelve false cuando no ha podido guardar");
  igual(guardar(), true, "y vuelve a funcionar cuando el almacén responde");
});

prueba("borrarTodosLosDatos bloquea guardados hasta recargar (si no, no se re-siembra)", () => {
  cargarDatosEjemplo();
  borrarTodosLosDatos();
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null, "el almacén queda vacío");

  // Si algo guardara ahora, la clave volvería a existir y al recargar
  // ES_PRIMERA_VEZ sería false -> te quedarías sin rutinas ni ejercicios.
  crearEjercicio({ nombre: "Colado", grupo: "Otro" });
  igual(guardar(), false, "el guardado está bloqueado");
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null, "sigue sin haber nada guardado");
});

prueba("cargar sin nada guardado, o con un JSON roto, empieza de cero", () => {
  localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
  let d = cargar();
  igual(d.ejercicios, []);
  igual(d.sesionActiva, null);
  igual(d.prefs.grupoPorDefecto, "Otro");

  localStorage.setItem(window.GYM_CLAVE_ALMACEN, "{ esto no es json");
  d = cargar();
  igual(d.ejercicios, []);
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

prueba("terminarSesion sin sesión activa devuelve null", () => {
  igual(sesionActiva(), null);
  igual(terminarSesion(), null);
});

prueba("empezarSesion con un ejercicio ya borrado lo marca como eliminado", () => {
  const e = crearEjercicio({ nombre: "Fantasma", grupo: "Otro" });
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 2 });
  borrarEjercicio(e.id);
  empezarSesion(r.id);
  igual(sesionActiva().ejercicios[0].exerciseNombre, "(ejercicio eliminado)");
  igual(sesionActiva().ejercicios[0].filas.length, 2);
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

// ---- Última vez / autocompletar serie (Entrenar) ----

prueba("mejorSerieUltimoDia: mejor serie (más peso, luego más reps) del día más reciente", () => {
  const e = crearEjercicio({ nombre: "Press", grupo: "Pecho" });
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: e.id, series: 3, reps: "8", peso: 50 });

  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0] = { pesoReal: "40", repsReal: "12", hecha: true };
  const antigua = terminarSesion();
  antigua.fecha = "2026-01-01T10:00:00.000Z";
  guardar();

  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0] = { pesoReal: "60", repsReal: "6", hecha: true };
  sesionActiva().ejercicios[0].filas[1] = { pesoReal: "60", repsReal: "8", hecha: true };
  sesionActiva().ejercicios[0].filas[2] = { pesoReal: "57.5", repsReal: "10", hecha: true };
  const reciente = terminarSesion();
  reciente.fecha = "2026-03-01T10:00:00.000Z";
  guardar();

  const m = mejorSerieUltimoDia(e.id);
  igual(m.peso, 60);
  igual(m.reps, 8, "a igual peso, la de más reps");
});

prueba("mejorSerieUltimoDia: null si el ejercicio no tiene historial", () => {
  const e = crearEjercicio({ nombre: "Sin uso", grupo: "Otro" });
  igual(mejorSerieUltimoDia(e.id), null);
});

prueba("debeMarcarSerie: solo con peso Y reps, y solo si no está marcada", () => {
  igual(debeMarcarSerie({ pesoReal: "60", repsReal: "8", hecha: false }), true);
  igual(debeMarcarSerie({ pesoReal: "0", repsReal: "8", hecha: false }), true);
  igual(debeMarcarSerie({ pesoReal: "", repsReal: "8", hecha: false }), false);
  igual(debeMarcarSerie({ pesoReal: "60", repsReal: "", hecha: false }), false);
  igual(debeMarcarSerie({ pesoReal: "60", repsReal: "8", hecha: true }), false);
});

prueba("construirEtiquetaTemp: ejercicio · reps · peso; vacío sin ejercicio", () => {
  igual(construirEtiquetaTemp({ ejercicio: "Press banca", reps: "8-12", peso: 60 }),
    "Press banca · 8-12 reps · 60 kg");
  igual(construirEtiquetaTemp({ ejercicio: "Dominadas", reps: "6-10", peso: 0 }),
    "Dominadas · 6-10 reps");
  igual(construirEtiquetaTemp({ ejercicio: "Plancha", reps: "", peso: 0 }), "Plancha");
  igual(construirEtiquetaTemp({}), "");
  igual(construirEtiquetaTemp(), "");
});

// ---- Avisos de sonido del temporizador (se programan por adelantado) ----

prueba("avisosDelTramo: tics 3-2-1 y un pitido de fin cuando viene otro tramo", () => {
  const a = avisosDelTramo(90, true);
  igual(a.map((x) => x.enSeg), [87, 88, 89, 90]);
  igual(a.map((x) => x.freq), [1320, 1320, 1320, 880]);
});

prueba("avisosDelTramo: tres pitidos al final si es el último tramo", () => {
  const finales = avisosDelTramo(30, false).filter((x) => x.freq === 880);
  igual(finales.length, 3);
});

prueba("avisosDelTramo: en un tramo muy corto solo caben los tics que quepan", () => {
  igual(avisosDelTramo(2, true).map((x) => x.enSeg), [1, 2]);
  igual(avisosDelTramo(0, true), []);
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

// ---- Guardado aplazado del entreno (no escribir en cada tecla) ----

function _prepararEntreno() {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 1 });
  empezarSesion(r.id);
  return r;
}

prueba("guardarSesionActiva() aplaza la escritura; con { inmediato } escribe ya", () => {
  _prepararEntreno();
  sesionActiva().ejercicios[0].filas[0].pesoReal = "60";

  // borramos la clave para ver si el guardado normal la recrea al momento
  localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
  guardarSesionActiva();
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null,
    "tecleando NO debe escribir en cada letra");

  guardarSesionActiva({ inmediato: true });
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.sesionActiva.ejercicios[0].filas[0].pesoReal, "60");
});

prueba("al esconder o cerrar la app se fuerza el guardado que estuviera en cola", () => {
  _prepararEntreno();
  sesionActiva().ejercicios[0].filas[0].repsReal = "8";

  localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
  guardarSesionActiva();                       // queda en cola
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null);

  _guardarPendienteYa();                       // lo que hacen pagehide / visibilitychange
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.sesionActiva.ejercicios[0].filas[0].repsReal, "8");
});

prueba("un guardado explicito cancela el que estuviera aplazado", () => {
  _prepararEntreno();
  guardarSesionActiva();                       // deja uno en cola
  guardar();                                   // lo cancela y escribe
  localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
  _guardarPendienteYa();                       // ya no queda nada pendiente
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null,
    "no deberia quedar ningun guardado en cola");
});

// ---- Copias corruptas (validacion de forma) ----

prueba("importarDatos rechaza una copia con la forma equivocada", () => {
  crearEjercicio({ nombre: "Importante", grupo: "Otro" });

  const malos = [
    { ejercicios: [{ nombre: "sin id" }], rutinas: [], sesiones: [] },
    { ejercicios: [], rutinas: [{ id: "r", nombre: "R" }], sesiones: [] },   // items no es lista
    { ejercicios: [], rutinas: [], sesiones: [{ id: "s", fecha: "x" }] },    // sets no es lista
  ];
  malos.forEach((copia, i) => {
    const r = importarDatos(JSON.stringify(copia));
    igual(r.ok, false, "la copia mala " + (i + 1) + " deberia rechazarse");
    esVerdad(typeof r.error === "string" && r.error.length > 0, "y decir por que");
  });
  igual(listarEjercicios().length, 1, "los datos de antes siguen intactos");
});

// ---- Guardado aplazado: ahora si podemos esperar de verdad (runner async) ----

prueba("el guardado aplazado acaba escribiendo solo, sin tocar nada mas", async () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 1 });
  empezarSesion(r.id);
  sesionActiva().ejercicios[0].filas[0].pesoReal = "72.5";

  localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
  guardarSesionActiva();
  igual(localStorage.getItem(window.GYM_CLAVE_ALMACEN), null, "aun no");

  await new Promise((res) => setTimeout(res, RETARDO_GUARDADO + 150));
  const enDisco = JSON.parse(localStorage.getItem(window.GYM_CLAVE_ALMACEN));
  igual(enDisco.sesionActiva.ejercicios[0].filas[0].pesoReal, "72.5", "y ahora si");
});

// ---- Espejo del tema (arranque sin parpadeo, sin parsear todo el almacen) ----

prueba("aplicarTema guarda la PREFERENCIA en la clave espejo, no el color resuelto", () => {
  guardarPref("tema", "claro");
  aplicarTema();
  igual(localStorage.getItem(CLAVE_TEMA), "claro");

  // con "sistema" debe guardarse "sistema" (si no, dejaria de seguir al movil)
  guardarPref("tema", "sistema");
  aplicarTema();
  igual(localStorage.getItem(CLAVE_TEMA), "sistema");
  esVerdad(["claro", "oscuro"].includes(temaEfectivo()), "pero el tema aplicado se resuelve");
});

prueba("borrarTodosLosDatos tambien se lleva el espejo del tema", () => {
  guardarPref("tema", "oscuro");
  aplicarTema();
  esVerdad(localStorage.getItem(CLAVE_TEMA) !== null);
  borrarTodosLosDatos();
  igual(localStorage.getItem(CLAVE_TEMA), null);
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

prueba("htmlEtiquetaDivision: <span> con la división, o cadena vacía si no hay", () => {
  igual(htmlEtiquetaDivision(""), "");
  igual(htmlEtiquetaDivision(null), "");
  const html = htmlEtiquetaDivision("Push");
  esVerdad(html.includes('data-division="Push"') && html.includes(">Push<"));
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

// ---- Actualización de versión (que la barra "Actualizar" no se quede pegada) ----

prueba("decidirActualizacion: primera instalación (sin SW previo) no recarga", () => {
  igual(decidirActualizacion({ habiaControlador: false, hayEntrenoEnCurso: false, yaHecho: false }), "nada");
});

prueba("decidirActualizacion: versión nueva y sin entreno en curso -> recargar", () => {
  igual(decidirActualizacion({ habiaControlador: true, hayEntrenoEnCurso: false, yaHecho: false }), "recargar");
});

prueba("decidirActualizacion: versión nueva con un entreno en curso -> avisar", () => {
  igual(decidirActualizacion({ habiaControlador: true, hayEntrenoEnCurso: true, yaHecho: false }), "avisar");
});

prueba("decidirActualizacion: no actúa dos veces en la misma carga de página", () => {
  igual(decidirActualizacion({ habiaControlador: true, hayEntrenoEnCurso: false, yaHecho: true }), "nada");
});

// Estas comprueban el "cableado": que sw.js y app.js siguen conectados como toca.
// (Regresión de la barra pegada: el SW no se activaba solo y app.js no recargaba.)
function _leerArchivo(ruta) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", ruta, false); // síncrono: el runner de pruebas no es async
  xhr.send();
  return xhr.responseText;
}

prueba("sw.js: el service worker nuevo se activa solo (skipWaiting + clients.claim)", () => {
  const src = _leerArchivo("../sw.js");
  esVerdad(/skipWaiting\s*\(\s*\)/.test(src), "sw.js debe llamar a self.skipWaiting()");
  esVerdad(/clients\.claim\s*\(\s*\)/.test(src), "sw.js debe llamar a clients.claim()");
});

prueba("app.js: reacciona a 'controllerchange' usando decidirActualizacion", () => {
  const src = _leerArchivo("../js/app.js");
  esVerdad(/controllerchange/.test(src), "app.js debe escuchar 'controllerchange'");
  esVerdad(/decidirActualizacion/.test(src), "app.js debe usar decidirActualizacion");
});

// ---- Fusión Rutinas + Entrenar ----

prueba("conflictoDeSesion: ninguna / misma / otra", () => {
  igual(conflictoDeSesion(null, "r1"), "ninguna");
  igual(conflictoDeSesion({ routineId: "r1" }, "r1"), "misma");
  igual(conflictoDeSesion({ routineId: "r2" }, "r1"), "otra");
});

prueba("index.html: una sola pestaña Entrenar (sin sección 'rutinas', 4 botones de menú)", () => {
  const html = _leerArchivo("../index.html");
  esVerdad(!/data-seccion="rutinas"/.test(html), "no debe quedar la sección 'rutinas'");
  esVerdad(/data-seccion="entrenar"/.test(html), "debe existir la sección 'entrenar'");
  igual((html.match(/class="menu-boton/g) || []).length, 4, "el menú inferior tiene 4 botones");
  esVerdad(/id="btn-empezar-entreno"/.test(html), "el detalle tiene el botón Empezar");
  esVerdad(/id="barra-entreno"/.test(html), "existe la barra 'entreno en curso'");
});

// Helper: mete styles.css de verdad y mide un elemento con esas clases
function _conEstilosReales(clases, fn) {
  const style = document.createElement("style");
  style.textContent = _leerArchivo("../css/styles.css");
  document.head.appendChild(style);
  const el = document.createElement("button");
  el.className = clases;
  el.textContent = "Aa";
  document.body.appendChild(el);
  try { return fn(el); } finally { el.remove(); style.remove(); }
}

function _contrasteDe(el) {
  const canal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const lum = (css) => {
    const [r, g, b] = css.match(/\d+/g).slice(0, 3).map(Number);
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const cs = getComputedStyle(el);
  const [claro, oscuro] = [lum(cs.color), lum(cs.backgroundColor)].sort((a, b) => b - a);
  return (claro + 0.05) / (oscuro + 0.05);
}

prueba("styles.css: el texto sobre el naranja de marca pasa AA (4,5:1)", () => {
  // Por esto el naranja de relleno se oscurecio a #d1440f: blanco encima da
  // 4,62:1. Con el #ff5722 de antes daba 3,16:1 y habia que poner texto casi
  // negro, que se leia como una senal de advertencia.
  ["boton-primario", "pildora-descanso", "barra-entreno", "aviso-version"].forEach((clase) => {
    const c = _conEstilosReales(clase, _contrasteDe);
    esVerdad(c >= 4.5, clase + " deberia pasar AA y da " + c.toFixed(2) + ":1");
  });
});

// Luminancia de un color en "#rrggbb" o "rgb(r, g, b)"
function _lumDe(css) {
  let r, g, b;
  const hex = css.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    r = parseInt(hex[1].slice(0, 2), 16);
    g = parseInt(hex[1].slice(2, 4), 16);
    b = parseInt(hex[1].slice(4, 6), 16);
  } else {
    [r, g, b] = css.match(/\d+/g).slice(0, 3).map(Number);
  }
  const canal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

// Mide el contraste entre dos variables de :root con un tema puesto
function _contrasteDeVariables(tema, varTexto, varFondo) {
  const style = document.createElement("style");
  style.textContent = _leerArchivo("../css/styles.css");
  document.head.appendChild(style);
  const antes = document.documentElement.dataset.tema;
  document.documentElement.dataset.tema = tema;
  try {
    const cs = getComputedStyle(document.documentElement);
    const [claro, oscuro] = [_lumDe(cs.getPropertyValue(varTexto)), _lumDe(cs.getPropertyValue(varFondo))]
      .sort((a, b) => b - a);
    return (claro + 0.05) / (oscuro + 0.05);
  } finally {
    if (antes) document.documentElement.dataset.tema = antes; else delete document.documentElement.dataset.tema;
    style.remove();
  }
}

prueba("styles.css: el naranja ESCRITO (--acento-texto) pasa AA en los dos temas", () => {
  // Hay dos naranjas y no son intercambiables: --acento rellena (lleva texto
  // blanco encima) y --acento-texto se escribe sobre el fondo. Si alguien usa
  // el de relleno como texto, sobre el fondo oscuro se queda en 3,5:1.
  [["oscuro", "#0d1620"], ["claro", "#ffffff"]].forEach(([tema]) => {
    ["--fondo", "--fondo-2"].forEach((fondo) => {
      const c = _contrasteDeVariables(tema, "--acento-texto", fondo);
      esVerdad(c >= 4.5, `tema ${tema}: --acento-texto sobre ${fondo} da ${c.toFixed(2)}:1`);
    });
  });
});

prueba("styles.css: el texto normal y el suave pasan AA en los dos temas", () => {
  ["oscuro", "claro"].forEach((tema) => {
    [["--texto", "--fondo"], ["--texto", "--fondo-2"],
     ["--texto-suave", "--fondo"], ["--texto-suave", "--fondo-2"]].forEach(([t, f]) => {
      const c = _contrasteDeVariables(tema, t, f);
      esVerdad(c >= 4.5, `tema ${tema}: ${t} sobre ${f} da ${c.toFixed(2)}:1`);
    });
  });
});

prueba("styles.css: los botones de icono tienen area tactil comoda (40x40 minimo)", () => {
  // Eran 29x26 y en las rutinas ✏️ y 🗑️ quedaban pegados: facil borrar sin querer.
  const r = _conEstilosReales("icono-boton", (el) => el.getBoundingClientRect());
  esVerdad(r.width >= 40 && r.height >= 40,
    "mide " + Math.round(r.width) + "x" + Math.round(r.height) + ", minimo 40x40");
});

prueba("styles.css: el atributo 'hidden' oculta DE VERDAD la barra de aviso", () => {
  // Bug real de la barra pegada: .aviso-version { display:flex } ganaba a
  // [hidden]{display:none}, así que la barra se veía siempre pasara lo que pasara.
  const style = document.createElement("style");
  style.textContent = _leerArchivo("../css/styles.css");
  document.head.appendChild(style);
  const el = document.createElement("div");
  el.className = "aviso-version";
  el.hidden = true;
  document.body.appendChild(el);
  const display = getComputedStyle(el).display;
  el.remove();
  style.remove();
  igual(display, "none", "con el atributo 'hidden', display debe ser 'none'");
});
