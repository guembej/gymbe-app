// ==========================================================
//  Rutinas iniciales — las rutinas reales del usuario.
//  Se cargan solas la primera vez que se abre la app en el dispositivo
//  (y otra vez si se pulsa "Borrar todos mis datos" y se recarga).
//  No duplican: si ya existe una rutina/ejercicio con ese nombre, se respeta.
//
//  Cada item: { ejercicio, grupo, series, reps, peso, descansoSeg, nota }
//   - grupo: uno de GRUPOS_MUSCULARES (se puede cambiar luego en la app)
//   - reps: texto libre corto ("8-10", "40s", "AMRAP (mín. 10)"...)
//   - peso: kg (0 = peso corporal o aún sin definir)
//   - descansoSeg: segundos (2:30 -> 150, 2:00 -> 120, 90s -> 90...)
// ==========================================================

const EJEMPLO_RUTINAS = [
  {
    nombre: "Empuje A - Gym", division: "Push",
    items: [
      { ejercicio: "Press banca", grupo: "Pecho", series: 4, reps: "6-8", peso: 50, descansoSeg: 150, nota: "" },
      { ejercicio: "Press inclinado con mancuernas", grupo: "Pecho", series: 3, reps: "8-12", peso: 20, descansoSeg: 120, nota: "" },
      { ejercicio: "Press militar con mancuernas", grupo: "Hombro", series: 3, reps: "8-10", peso: 15, descansoSeg: 120, nota: "" },
      { ejercicio: "Elevaciones laterales", grupo: "Hombro", series: 3, reps: "12-15", peso: 7, descansoSeg: 90, nota: "" },
      { ejercicio: "Fondos en paralelas", grupo: "Pecho", series: 3, reps: "8-12", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Extensión de tríceps en polea", grupo: "Tríceps", series: 3, reps: "12-15", peso: 20, descansoSeg: 90, nota: "" },
    ],
  },
  {
    nombre: "Tirón A - Calistenia", division: "Pull",
    items: [
      { ejercicio: "Dead hang (colgarse de barra)", grupo: "Espalda", series: 3, reps: "40s", peso: 0, descansoSeg: 60, nota: "Activación de agarre y hombro" },
      { ejercicio: "Dominadas agarre ancho", grupo: "Espalda", series: 4, reps: "6-8", peso: 0, descansoSeg: 120, nota: "Foco en anchura dorsal" },
      { ejercicio: "Dominadas pronas", grupo: "Espalda", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "" },
      { ejercicio: "Dominadas supinas", grupo: "Espalda", series: 3, reps: "8-10", peso: 0, descansoSeg: 90, nota: "Más énfasis en bíceps" },
      { ejercicio: "Remo en anillas", grupo: "Espalda", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "Espalda media y deltoide posterior" },
      { ejercicio: "Bíceps martillo con mancuerna", grupo: "Bíceps", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "Bíceps y antebrazo" },
    ],
  },
  {
    nombre: "Tirón B - Gym", division: "Pull",
    items: [
      { ejercicio: "Jalón al pecho en polea (agarre ancho)", grupo: "Espalda", series: 4, reps: "8-10", peso: 0, descansoSeg: 120, nota: "" },
      { ejercicio: "Remo con mancuerna a un brazo", grupo: "Espalda", series: 4, reps: "8-10", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Remo en polea baja, agarre neutro", grupo: "Espalda", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Pájaros / face pull con mancuerna", grupo: "Hombro", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "" },
      { ejercicio: "Bíceps con barra Z", grupo: "Bíceps", series: 3, reps: "8-10", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Bíceps curl banco inclinado con mancuerna", grupo: "Bíceps", series: 3, reps: "10-12", peso: 0, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Empuje B - Calistenia", division: "Push",
    items: [
      { ejercicio: "Press militar con barra", grupo: "Hombro", series: 4, reps: "6-8", peso: 0, descansoSeg: 150, nota: "" },
      { ejercicio: "Press inclinado con mancuernas", grupo: "Pecho", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "" },
      { ejercicio: "Flexiones", grupo: "Pecho", series: 3, reps: "AMRAP (mín. 10)", peso: 0, descansoSeg: 90, nota: "pies elevados o lastradas" },
      { ejercicio: "Elevaciones laterales", grupo: "Hombro", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "" },
      { ejercicio: "Fondos en máquina", grupo: "Pecho", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Extensión de tríceps en polea (cuerda)", grupo: "Tríceps", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "Codo pegado al cuerpo, evita el estiramiento overhead que te carga el codo" },
    ],
  },
  {
    nombre: "Pierna A", division: "Pierna",
    items: [
      { ejercicio: "Sentadilla libre o en Smith", grupo: "Pierna", series: 4, reps: "8-10", peso: 0, descansoSeg: 150, nota: "Retomando forma, sube peso poco a poco" },
      { ejercicio: "Peso muerto rumano con mancuernas", grupo: "Pierna", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "Isquios y glúteo" },
      { ejercicio: "Prensa de piernas", grupo: "Pierna", series: 3, reps: "10-12", peso: 0, descansoSeg: 120, nota: "" },
      { ejercicio: "Curl femoral tumbado", grupo: "Pierna", series: 3, reps: "12-15", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Zancadas caminando con mancuernas", grupo: "Pierna", series: 3, reps: "10-12 por pierna", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Elevación de talones de pie (gemelo)", grupo: "Pierna", series: 3, reps: "15-20", peso: 0, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Pierna B", division: "Pierna",
    items: [
      { ejercicio: "Peso muerto rumano con barra", grupo: "Pierna", series: 4, reps: "8-10", peso: 0, descansoSeg: 150, nota: "" },
      { ejercicio: "Sentadilla búlgara con mancuernas", grupo: "Pierna", series: 3, reps: "10-12 por pierna", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Hip thrust", grupo: "Pierna", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Extensión de cuádriceps", grupo: "Pierna", series: 3, reps: "12-15", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Curl femoral sentado", grupo: "Pierna", series: 3, reps: "12-15", peso: 0, descansoSeg: 90, nota: "" },
      { ejercicio: "Elevación de talones sentado (gemelo/sóleo)", grupo: "Pierna", series: 3, reps: "15-20", peso: 0, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Full Body", division: "Full Body",
    items: [
      { ejercicio: "Sentadilla libre", grupo: "Pierna", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Pierna completa" },
      { ejercicio: "Press banca o press inclinado con mancuernas", grupo: "Pecho", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Empuje" },
      { ejercicio: "Remo con barra o jalón al pecho", grupo: "Espalda", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Tirón" },
      { ejercicio: "Peso muerto rumano", grupo: "Pierna", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "Posterior/isquios" },
      { ejercicio: "Press militar con mancuernas", grupo: "Hombro", series: 3, reps: "8-10", peso: 0, descansoSeg: 90, nota: "Hombro" },
      { ejercicio: "Bíceps curl con mancuerna", grupo: "Bíceps", series: 2, reps: "10-12", peso: 0, descansoSeg: 60, nota: "" },
      { ejercicio: "Extensión de tríceps en polea (cuerda)", grupo: "Tríceps", series: 2, reps: "10-12", peso: 0, descansoSeg: 60, nota: "Codo pegado al cuerpo" },
      { ejercicio: "Elevación de talones de pie", grupo: "Pierna", series: 2, reps: "15-20", peso: 0, descansoSeg: 45, nota: "Gemelo" },
      { ejercicio: "Plancha", grupo: "Core", series: 2, reps: "40-60s", peso: 0, descansoSeg: 45, nota: "Core" },
    ],
  },
  {
    nombre: "Superior A", division: "Superior",
    items: [
      { ejercicio: "Press banca", grupo: "Pecho", series: 4, reps: "6-8", peso: 0, descansoSeg: 150, nota: "Pecho" },
      { ejercicio: "Remo con barra o mancuerna", grupo: "Espalda", series: 4, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Espalda, grosor" },
      { ejercicio: "Press militar con mancuernas", grupo: "Hombro", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Hombro" },
      { ejercicio: "Jalón al pecho o dominadas", grupo: "Espalda", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Espalda, anchura" },
      { ejercicio: "Elevaciones laterales", grupo: "Hombro", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "Hombro lateral" },
      { ejercicio: "Bíceps curl con mancuerna", grupo: "Bíceps", series: 2, reps: "10-12", peso: 0, descansoSeg: 60, nota: "" },
      { ejercicio: "Extensión de tríceps en polea", grupo: "Tríceps", series: 2, reps: "10-12", peso: 0, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Superior B", division: "Superior",
    items: [
      { ejercicio: "Press inclinado con mancuernas", grupo: "Pecho", series: 4, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Pecho superior" },
      { ejercicio: "Remo en polea baja", grupo: "Espalda", series: 3, reps: "10-12", peso: 0, descansoSeg: 90, nota: "Espalda" },
      { ejercicio: "Face pull", grupo: "Hombro", series: 3, reps: "12-15", peso: 0, descansoSeg: 60, nota: "Deltoide posterior" },
      { ejercicio: "Fondos en paralelas", grupo: "Pecho", series: 3, reps: "8-12", peso: 0, descansoSeg: 90, nota: "Pecho/tríceps" },
      { ejercicio: "Dominadas o jalón supino", grupo: "Espalda", series: 3, reps: "8-10", peso: 0, descansoSeg: 120, nota: "Espalda/bíceps" },
      { ejercicio: "Bíceps martillo con mancuerna", grupo: "Bíceps", series: 2, reps: "10-12", peso: 0, descansoSeg: 60, nota: "" },
      { ejercicio: "Elevaciones laterales en polea", grupo: "Hombro", series: 2, reps: "12-15", peso: 0, descansoSeg: 60, nota: "" },
    ],
  },
];

// Crea los ejercicios y las rutinas iniciales que aún no existan (por nombre).
// Devuelve { rutinasAñadidas, ejerciciosAñadidos }.
function cargarDatosEjemplo() {
  const idPorNombre = {};
  let ejerciciosAñadidos = 0;

  // 1) Grupo muscular de cada ejercicio: el primero que aparezca manda
  const grupoDe = {};
  EJEMPLO_RUTINAS.forEach((r) => {
    r.items.forEach((it) => {
      if (!(it.ejercicio in grupoDe)) grupoDe[it.ejercicio] = it.grupo || "Otro";
    });
  });

  // 2) Asegurar los ejercicios
  Object.keys(grupoDe).forEach((nombre) => {
    const existente = listarEjercicios().find((e) => e.nombre === nombre);
    if (existente) {
      idPorNombre[nombre] = existente.id;
    } else {
      idPorNombre[nombre] = crearEjercicio({ nombre, grupo: grupoDe[nombre] }).id;
      ejerciciosAñadidos++;
    }
  });

  // 3) Crear las rutinas que no existan ya (por nombre)
  let rutinasAñadidas = 0;
  EJEMPLO_RUTINAS.forEach((plantilla) => {
    if (listarRutinas().some((r) => r.nombre === plantilla.nombre)) return;

    const rutina = crearRutina({ nombre: plantilla.nombre, division: plantilla.division });
    plantilla.items.forEach((it) => {
      añadirItemRutina(rutina.id, {
        exerciseId: idPorNombre[it.ejercicio],
        series: it.series,
        reps: it.reps,
        peso: it.peso,
        descansoSeg: it.descansoSeg,
        nota: it.nota,
      });
    });
    rutinasAñadidas++;
  });

  return { rutinasAñadidas, ejerciciosAñadidos };
}

// La primera vez que se abre la app en este dispositivo cargamos las rutinas
// para no empezar con la pantalla en blanco. Después, si borras todo desde
// Ajustes, ya no se vuelven a cargar solas.
// (En la página de pruebas no se hace: usa su propia clave de almacenamiento.)
if (typeof ES_PRIMERA_VEZ !== "undefined" && !window.GYM_CLAVE_ALMACEN && ES_PRIMERA_VEZ) {
  cargarDatosEjemplo();
}
