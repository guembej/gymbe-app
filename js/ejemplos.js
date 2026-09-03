// ==========================================================
//  Datos de ejemplo — para probar la app o empezar con algo.
//  Se cargan desde el botón "Cargar datos de ejemplo" en Ajustes.
//  No duplica: si ya existe una rutina/ejercicio con ese nombre, lo respeta.
// ==========================================================

// Cada ejercicio usado en las rutinas, con su grupo muscular
const EJEMPLO_EJERCICIOS = {
  "Press banca": "Pecho",
  "Press inclinado con mancuernas": "Pecho",
  "Press militar": "Hombro",
  "Elevaciones laterales": "Hombro",
  "Extensión de tríceps en polea": "Tríceps",
  "Dominadas": "Espalda",
  "Remo con barra": "Espalda",
  "Jalón al pecho": "Espalda",
  "Curl con barra": "Bíceps",
  "Curl martillo": "Bíceps",
  "Sentadilla trasera": "Pierna",
  "Peso muerto rumano": "Pierna",
  "Prensa de piernas": "Pierna",
  "Curl femoral tumbado": "Pierna",
  "Elevación de gemelos": "Pierna",
};

const EJEMPLO_RUTINAS = [
  {
    nombre: "Empuje", division: "Push",
    items: [
      { ejercicio: "Press banca", series: 4, reps: "6-8", peso: 60, descansoSeg: 150, nota: "progresar carga" },
      { ejercicio: "Press inclinado con mancuernas", series: 3, reps: "8-12", peso: 22, descansoSeg: 120, nota: "" },
      { ejercicio: "Press militar", series: 3, reps: "8-10", peso: 35, descansoSeg: 120, nota: "sin rebote" },
      { ejercicio: "Elevaciones laterales", series: 4, reps: "12-15", peso: 8, descansoSeg: 60, nota: "controlado" },
      { ejercicio: "Extensión de tríceps en polea", series: 3, reps: "12-15", peso: 20, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Tirón", division: "Pull",
    items: [
      { ejercicio: "Dominadas", series: 4, reps: "6-10", peso: 0, descansoSeg: 150, nota: "lastre si salen fáciles" },
      { ejercicio: "Remo con barra", series: 4, reps: "8-10", peso: 50, descansoSeg: 120, nota: "espalda neutra" },
      { ejercicio: "Jalón al pecho", series: 3, reps: "10-12", peso: 45, descansoSeg: 90, nota: "" },
      { ejercicio: "Curl con barra", series: 3, reps: "8-10", peso: 25, descansoSeg: 75, nota: "" },
      { ejercicio: "Curl martillo", series: 3, reps: "10-12", peso: 12, descansoSeg: 60, nota: "" },
    ],
  },
  {
    nombre: "Pierna", division: "Pierna",
    items: [
      { ejercicio: "Sentadilla trasera", series: 4, reps: "5", peso: 90, descansoSeg: 180, nota: "calentar bien antes" },
      { ejercicio: "Peso muerto rumano", series: 3, reps: "8-10", peso: 70, descansoSeg: 150, nota: "" },
      { ejercicio: "Prensa de piernas", series: 3, reps: "12-15", peso: 160, descansoSeg: 120, nota: "" },
      { ejercicio: "Curl femoral tumbado", series: 3, reps: "10-12", peso: 30, descansoSeg: 75, nota: "" },
      { ejercicio: "Elevación de gemelos", series: 4, reps: "15-20", peso: 40, descansoSeg: 45, nota: "pausa arriba" },
    ],
  },
];

// De un rango "8-12" saca un número representativo (10); "5" -> 5; "45 s" -> "45 s"
function _repsRepresentativas(reps) {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(reps || "");
  if (m) return Math.round((Number(m[1]) + Number(m[2])) / 2);
  return reps || "";
}

// Construye una sesión ya terminada a partir de una rutina y una fecha pasada.
// 'ajustePrimero' solo afecta al primer ejercicio de la rutina (el principal),
// para simular progresión sin que los ejercicios ligeros queden raros.
function _sesionEjemplo(rutinaNombre, haceDias, ajustePrimero) {
  const rutina = listarRutinas().find((r) => r.nombre === rutinaNombre);
  if (!rutina) return null;

  const fecha = new Date(Date.now() - haceDias * 86400000);
  fecha.setHours(18, 10 + (haceDias % 25), 0, 0); // entreno por la tarde-noche
  const inicio = new Date(fecha.getTime() - 50 * 60000); // ~50 min de entreno

  const sets = [];
  rutina.items.forEach((item, indiceItem) => {
    const ej = obtenerEjercicio(item.exerciseId);
    const ajuste = indiceItem === 0 ? (ajustePrimero || 0) : 0;
    for (let i = 0; i < item.series; i++) {
      sets.push({
        exerciseId: item.exerciseId,
        exerciseNombre: ej ? ej.nombre : "(ejercicio)",
        serie: i + 1,
        pesoReal: Math.max(0, item.peso + ajuste),
        repsReal: String(_repsRepresentativas(item.reps)),
      });
    }
  });

  return {
    id: nuevoId(),
    routineId: rutina.id,
    routineNombre: rutina.nombre,
    division: rutina.division,
    inicio: inicio.toISOString(),
    fecha: fecha.toISOString(),
    sets,
  };
}

// Mete un pequeño historial de ejemplo (solo si no hay ninguno todavía).
// Devuelve cuántas sesiones se añadieron.
function crearSesionesEjemplo() {
  if (DATOS.sesiones.length > 0 || DATOS.ejemplosHistorialHecho) return 0;

  // Muchas sesiones de Empuje con Press banca subiendo de 37,5 a 60 kg,
  // para que la gráfica de Progreso tenga bastantes puntos.
  const sesiones = [
    _sesionEjemplo("Empuje", 65, -22.5),
    _sesionEjemplo("Pierna", 61, -5),
    _sesionEjemplo("Empuje", 58, -20),
    _sesionEjemplo("Empuje", 51, -17.5),
    _sesionEjemplo("Tirón", 48, 0),
    _sesionEjemplo("Empuje", 44, -15),
    _sesionEjemplo("Empuje", 37, -12.5),
    _sesionEjemplo("Pierna", 34, 0),
    _sesionEjemplo("Empuje", 30, -10),
    _sesionEjemplo("Empuje", 23, -7.5),
    _sesionEjemplo("Tirón", 20, 0),
    _sesionEjemplo("Empuje", 16, -5),
    _sesionEjemplo("Empuje", 9, -2.5),
    _sesionEjemplo("Pierna", 6, 0),
    _sesionEjemplo("Empuje", 2, 0),
  ].filter(Boolean);

  DATOS.sesiones.push(...sesiones);
  DATOS.ejemplosHistorialHecho = true;
  guardar();
  return sesiones.length;
}

// Devuelve { rutinasAñadidas, ejerciciosAñadidos, sesionesAñadidas }
function cargarDatosEjemplo() {
  const idPorNombre = {};
  let ejerciciosAñadidos = 0;

  // 1) Asegurar los ejercicios necesarios
  Object.keys(EJEMPLO_EJERCICIOS).forEach((nombre) => {
    const existente = listarEjercicios().find((e) => e.nombre === nombre);
    if (existente) {
      idPorNombre[nombre] = existente.id;
    } else {
      idPorNombre[nombre] = crearEjercicio({ nombre, grupo: EJEMPLO_EJERCICIOS[nombre] }).id;
      ejerciciosAñadidos++;
    }
  });

  // 2) Crear las rutinas que no existan ya (por nombre)
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

  // 3) Un pequeño historial de ejemplo
  const sesionesAñadidas = crearSesionesEjemplo();

  return { rutinasAñadidas, ejerciciosAñadidos, sesionesAñadidas };
}

// La primera vez que se abre la app en este dispositivo, cargamos datos de ejemplo
// para no empezar con la pantalla en blanco. Después, si borras todo desde Ajustes,
// ya no se vuelven a cargar solos.
// (En la página de pruebas no se hace: usa su propia clave de almacenamiento.)
if (typeof ES_PRIMERA_VEZ !== "undefined" && !window.GYM_CLAVE_ALMACEN) {
  if (ES_PRIMERA_VEZ) {
    cargarDatosEjemplo();
  } else if (DATOS.rutinas.length > 0 && !DATOS.ejemplosHistorialHecho && DATOS.sesiones.length === 0) {
    // Instalación que ya tenía rutinas de ejemplo pero aún sin historial de ejemplo
    crearSesionesEjemplo();
  }
}
