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

prueba("los números del item se normalizan (series ≥ 1, peso ≥ 0)", () => {
  const r = crearRutina({ nombre: "D" });
  añadirItemRutina(r.id, { exerciseId: "x", series: 0, peso: -5, descansoSeg: "abc" });
  const item = obtenerRutina(r.id).items[0];
  igual(item.series, 1);
  igual(item.peso, 0);
  igual(item.descansoSeg, 0);
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

// ---- Utilidades ----

prueba("escaparHtml neutraliza etiquetas HTML", () => {
  igual(escaparHtml("<b>hola</b>"), "&lt;b&gt;hola&lt;/b&gt;");
});
