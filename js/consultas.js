// @ts-check
// ==========================================================
//  Consultas derivadas del historial
//  Solo leen: progreso, ultima marca, si una serie se marca sola.
// ==========================================================

// ----------------------------------------------------------
//  Indice de sets por ejercicio
//  Sin el, cada consulta recorria y REORDENABA todo el historial, y eso pasa
//  una vez por ejercicio y por repintado. Se construye a demanda y se tira
//  cuando cambia el historial.
// ----------------------------------------------------------

let _indiceSets = null;

function _indice() {
  if (_indiceSets) return _indiceSets;
  _indiceSets = new Map();
  [...DATOS.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha)) // de mas reciente a mas antigua
    .forEach((sesion) => {
      sesion.sets.forEach((set) => {
        if (!_indiceSets.has(set.exerciseId)) _indiceSets.set(set.exerciseId, []);
        _indiceSets.get(set.exerciseId).push({ set, fecha: sesion.fecha, sesionId: sesion.id });
      });
    });
  return _indiceSets;
}

// Lo llaman terminarSesion(), borrarSesion() e importarDatos().
function invalidarIndiceSets() {
  _indiceSets = null;
}

// Ejercicios cuyo nombre contiene 'texto' (ignora mayúsculas y tildes).
// Devuelve { coincidencias: [...], hayExacto } — hayExacto = ya existe uno igual.
function filtrarEjercicios(texto, limite = 6) {
  const t = _sinTildes(texto).trim();
  if (!t) return { coincidencias: [], hayExacto: false };
  const todos = listarEjercicios();
  return {
    coincidencias: todos.filter((e) => _sinTildes(e.nombre).includes(t)).slice(0, limite),
    hayExacto: todos.some((e) => _sinTildes(e.nombre).trim() === t),
  };
}

// ----------------------------------------------------------
//  Progreso: evolución de un ejercicio a lo largo del historial
//  Devuelve un punto por sesión (orden: de más antigua a más reciente):
//    { fecha, sesionId, pesoMax, volumen, rm }
//  - pesoMax: el peso más alto levantado ese día
//  - volumen: suma de peso x repeticiones
//  - rm: 1RM estimado (Epley) de la mejor serie: peso x (1 + reps/30)
// ----------------------------------------------------------
// La mejor serie del día más reciente en que se registró este ejercicio.
// "Mejor" = más peso; a igualdad de peso, más repeticiones.
// Devuelve { peso, reps, fecha } o null si no hay ningún registro.
function mejorSerieUltimoDia(exerciseId) {
  const entradas = _indice().get(exerciseId);
  if (!entradas || entradas.length === 0) return null;

  // El indice viene ordenado: la primera entrada marca el dia mas reciente.
  const fecha = entradas[0].fecha;
  let mejor = null;
  for (const e of entradas) {
    if (e.fecha !== fecha) break;
    const peso = _num(e.set.pesoReal, 0, 0);
    const reps = parseInt(e.set.repsReal, 10) || 0;
    if (!mejor || peso > mejor.peso || (peso === mejor.peso && reps > mejor.reps)) {
      mejor = { peso, reps };
    }
  }
  return { peso: mejor.peso, reps: mejor.reps, fecha };
}

// Al pulsar "Empezar entrenamiento" con una rutina, ¿qué relación tiene con el
// entreno que ya haya en curso? "ninguna" | "misma" (misma rutina) | "otra".
function conflictoDeSesion(sesion, rutinaId) {
  if (!sesion) return "ninguna";
  return sesion.routineId === rutinaId ? "misma" : "otra";
}

// ¿Esta serie cuenta como hecha? Sí en cuanto tiene repeticiones.
//
// El peso NO entra en la cuenta a propósito: las repeticiones son lo que dice
// que la serie ha ocurrido; el peso es un dato de esa serie. Si se exigieran los
// dos, los ejercicios de peso corporal (fondos, dominadas, toda la calistenia)
// se perderían en silencio al terminar el entreno.
//
// Antes había ademas una casilla para marcarlas a mano. Se quitó en la v1.8.0:
// si rellenas la fila ya está hecha, y nadie la tocaba nunca.
function serieRegistrada(fila) {
  return String(fila.repsReal == null ? "" : fila.repsReal).trim() !== "";
}

function progresoDeEjercicio(exerciseId) {
  const puntos = [];

  DATOS.sesiones.forEach((sesion) => {
    const sets = sesion.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length === 0) return;

    let pesoMax = 0;
    let volumen = 0;
    let rm = 0;
    let mejorUnidad = 0;   // la mejor serie del dia, en reps o en segundos
    let totalUnidad = 0;   // la suma del dia, en reps o en segundos
    sets.forEach((set) => {
      const peso = _num(set.pesoReal, 0, 0);
      const reps = parseInt(set.repsReal, 10) || 0;
      if (peso > pesoMax) pesoMax = peso;
      volumen += peso * reps;
      const rmSet = reps > 0 ? peso * (1 + reps / 30) : peso;
      if (rmSet > rm) rm = rmSet;
      if (reps > mejorUnidad) mejorUnidad = reps;
      totalUnidad += reps;
    });

    puntos.push({
      fecha: sesion.fecha,
      sesionId: sesion.id,
      pesoMax: Math.round(pesoMax * 10) / 10,
      volumen: Math.round(volumen),
      rm: Math.round(rm * 10) / 10,
      mejorUnidad,
      totalUnidad,
    });
  });

  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Que metricas tienen sentido para un ejercicio. Se decide mirando DOS cosas:
//   - si el ejercicio se mide en segundos (lo dice su ficha)
//   - si alguna vez se ha anotado peso (se deduce del historial, no de un flag:
//     el dia que empieces a lastrar los fondos, aparece sola)
//
// Sin esto, un ejercicio de peso corporal ensenaba Peso maximo / Volumen /
// 1RM estimado, y las tres valen 0 para siempre: la grafica era una raya en el
// cero aunque pasaras de 6 a 12 dominadas. Afectaba a toda la calistenia.
//
// Como maximo tres, que es lo que cabe en el conmutador del movil.
function metricasDeEjercicio(exerciseId) {
  const porTiempo = seMidePorTiempo(obtenerEjercicio(exerciseId));
  const conPeso = DATOS.sesiones.some((s) =>
    s.sets.some((x) => x.exerciseId === exerciseId && _num(x.pesoReal, 0, 0) > 0)
  );

  if (porTiempo) {
    const m = [
      { clave: "mejorUnidad", etiqueta: "Tiempo máx.", unidad: "tiempo" },
      { clave: "totalUnidad", etiqueta: "Tiempo total", unidad: "tiempo" },
    ];
    if (conPeso) m.push({ clave: "pesoMax", etiqueta: "Peso máx.", unidad: "kg" });
    return m;
  }
  if (!conPeso) {
    return [
      { clave: "mejorUnidad", etiqueta: "Reps máx.", unidad: "reps" },
      { clave: "totalUnidad", etiqueta: "Reps totales", unidad: "reps" },
    ];
  }
  return [
    { clave: "pesoMax", etiqueta: "Peso máx.", unidad: "kg" },
    { clave: "volumen", etiqueta: "Volumen", unidad: "kg" },
    { clave: "rm", etiqueta: "1RM est.", unidad: "kg" },
  ];
}
