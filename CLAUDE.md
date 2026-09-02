# CLAUDE.md — Notas del proyecto

## Qué es esto
App personal (PWA) para registrar entrenamientos de gimnasio y seguir el progreso.
El usuario **no es programador profesional**: explicar las cosas en lenguaje llano,
ir por fases, no dar nada por sabido, confirmar antes de introducir complejidad.

## Principios
- Sencillez por encima de todo. HTML + CSS + JavaScript sin frameworks ni build.
- Offline y sin nube. Datos en `localStorage`. Copias por export/import de un `.json`.
- Interfaz en español. Peso en kg.
- Sin plantillas de ejercicios: el usuario los escribe a mano.
- Todo debe poder probarse abriendo el proyecto en el navegador del PC.

## Plan
Ver `ROADMAP.md`. Trabajar fase a fase; no avanzar hasta que la actual funcione
y el usuario la entienda. Marcar el progreso en la sección "Estado actual" de `ROADMAP.md`.

## Estructura
```
index.html        Punto de entrada
css/styles.css     Estilos
js/app.js          Lógica principal
assets/            Iconos, librerías locales
```

## Modelo de datos (real, clave localStorage `gym.datos.v1`)
- `ejercicios`: [{ id, nombre, grupo, nota }]
  - `grupo` de lista fija `GRUPOS_MUSCULARES` (Pecho, Espalda, Pierna, Hombro, Bíceps, Tríceps, Core, Otro)
- `rutinas`: [{ id, nombre, division, items: [{ exerciseId, series, reps, peso, descansoSeg, nota }] }]
  - `division` opcional, lista fija `DIVISIONES` (Full Body, Push, Pull, Pierna, Torso, Superior, Inferior, Otro); "" = sin división
  - `reps` es texto libre corto: "10" o rango "8-12"
- `sesiones`: [{ id, routineId, fecha, sets: [{ exerciseId, serie, pesoReal, repsReal }] }]

## Cómo probar
- App: `node server.js` y abrir http://localhost:5173
- Pruebas: abrir http://localhost:5173/tests/tests.html — deben pasar todas (verde).
  Runner casero sin dependencias (`tests/mini-test.js`); las pruebas están en `tests/tests.js`.
  Usan la clave `gymbe.pruebas` (vía `window.GYM_CLAVE_ALMACEN`), no tocan datos reales.
  `_reiniciarDatos()` en datos.js deja los datos a cero entre pruebas.

## Convenciones
- Comentarios en español, breves.
- Nombres de variables en español o inglés simple, coherentes con el archivo.
- Un commit por cada paso con sentido; mensajes en español.
- **Cada cambio en la lógica de datos añade o actualiza pruebas en `tests/tests.js`.**
  Ejecutar tests.html antes de dar un paso por terminado.
- **Cada fase nueva amplía `js/ejemplos.js`** con un par de ejemplos de esa función,
  para poder ver cómo queda. Se cargan solos en la primera apertura (o tras "Borrar
  todos mis datos" + recargar). Guardar con flag propio para no duplicar.
