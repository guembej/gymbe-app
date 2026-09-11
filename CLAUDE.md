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
index.html          Punto de entrada (todas las pantallas y diálogos)
css/styles.css      Estilos
assets/             Iconos
js/
  version.js        APP_VERSION
  iconos.js         icono() / nodoIcono(): helper de los iconos SVG
  formato.js        texto, números y tiempo (funciones puras)
  grafica.js        matemática de los ejes de Progreso
  datos.js          el almacén: cargar/guardar, preferencias, tema, export/import
  temporizador.js   configuración, tramos y avisos del temporizador de series
  entidades.js      ejercicios · rutinas · entrenamientos (crear/editar/borrar)
  consultas.js      lecturas derivadas del historial (progreso, última marca)
  ejemplos.js       rutinas iniciales
  dialogos.js       confirmar() / avisar()
  ejercicios.js · rutinas.js · entrenar.js · historial.js · progreso.js · tiempo.js
  aviso-version.js  decidirActualizacion()
  ajustes.js
  app.js            navegación + service worker
```
El orden de los `<script>` en `index.html` importa: son scripts normales que
comparten ámbito global. `formato` y `grafica` van antes que `datos`, y `datos`
antes que `entidades`.

## Ajustes (v1.8.0+)
Grupos al estilo de los ajustes del móvil: encabezado gris pequeño (`.aj-titulo`)
y una tarjeta con las filas dentro (`.aj-tarjeta` / `.aj-fila`). El texto va antes
que el control y la fila entera (52px) es el área táctil.
- Los interruptores son `<input type="checkbox">` normales: la pastilla es solo
  el aspecto (`.aj-switch`), así que `conectarPref()` no cambia.
- El tema es un `.conmutador` de tres botones `[data-tema]`, no radios. Ojo: el
  manejador genérico de `.conmutador-boton` en `app.js` sale pronto si no hay
  `data-vista`, por eso no chocan.
- "Borrar todos mis datos" vive en su propio bloque `.aj-peligro`, separado de
  Exportar/Importar. El botón se deja pequeño a propósito.
- El smoke test comprueba que siguen existiendo los id que `ajustes.js` engancha:
  si se renombra uno al retocar el maquetado, la preferencia deja de guardarse
  sin dar ningún error.

## Avisos del temporizador (v1.9.0+)
`avisosDelTramo()` en `temporizador.js` devuelve `{freq, enSeg, dur, vol}`:
un tic flojo por segundo en los **últimos 5**, y de remate **notas subiendo**
(dos si viene otro tramo, las tres 880/1175/1568 si se acabó el entreno).
- La onda es **cuadrada** con un paso bajo, no senoidal: una senoidal es un tono
  puro sin armónicos, la forma de onda que menos se oye, y en un gimnasio con
  música se perdía entera.
- `volumenAviso` en prefs (`bajo`/`medio`/`alto`, por defecto **alto**) escala el
  volumen. Al cambiarlo en Ajustes suena una muestra (`sonarMuestraAviso`).
- **No se usa la voz del sistema** para la cuenta atrás. Los tonos se programan
  por adelantado con Web Audio, que cumple la cita con el móvil bloqueado; la voz
  hay que pedirla en el momento, y en ese momento la app puede estar dormida.

## Ventana flotante (PiP) (v1.9.0+)
Se dibuja en un canvas de `ANCHO_PIP x ALTO_PIP` (320x134, 2,39:1 es lo más plano
que Chrome-Android permite) pero a `ESCALA_PIP` = 3. Android estira la ventana:
a tamaño 1x se veía una imagen pequeña ampliada, con los bordes blandos.
- La familia de letra se **lee del `.tiempo-display` de la pantalla**
  (`_familiaPiP`), no se repite a mano: así no pueden separarse.
- `_numeroTabular()` dibuja cada dígito en una casilla del mismo ancho. El canvas
  no tiene `tabular-nums` (el CSS del cronómetro sí), y según la letra que
  resuelva el móvil el número se movería solo cada segundo.

## Navegación (v1.2.0+)
4 pestañas: **Entrenar · Historial · Progreso · Tiempo**. "Entrenar" reúne lo que
antes eran Rutinas + Entrenar: sub-conmutador Rutinas|Ejercicios; tocar una rutina
abre su detalle en modo "ver" (ejercicios en solo lectura + botón "Empezar
entrenamiento" + enlace "Editar rutina"); "Editar rutina" pasa a modo edición
(`#rutina-detalle.modo-edicion`). Al empezar, el panel `#entrenar-activo` sustituye
a la lista dentro de esa vista. Barra `#barra-entreno` ("entreno en curso") en las
demás pestañas para volver. `.oculta` y `[hidden]` llevan `display:none!important`.

## Iconos (v1.6.0+)
No hay emojis en la interfaz: cada uno se ve distinto según el sistema y no se
puede colorear. Los iconos son `<symbol id="ico-...">` definidos una sola vez en
`index.html` (rejilla 24x24, solo trazo) y colocados con
`<svg class="ico"><use href="#ico-NOMBRE" /></svg>`. Desde JavaScript, `icono("editar")`.
El grosor y el tamaño los fija `.ico` en `styles.css`; el color lo heredan del
texto (`stroke: currentColor`), por eso se tiñen solos de naranja al activarse.
El smoke test comprueba que ningún `<use>` apunta a un `<symbol>` inexistente
(el navegador no avisa: solo deja el hueco vacío).

## Colores (v1.7.0+)
**Hay dos naranjas y no son intercambiables.** Es el error facil de cometer:
- `--acento` (#d1440f) **rellena**: botones, barras, la pildora. Encima va
  `--sobre-acento` (blanco), que da 4,6:1. El #ff5722 de antes solo daba 3,16:1
  con blanco y obligaba a texto casi negro, que se leia como una advertencia.
- `--acento-texto` **se escribe** sobre el fondo: enlaces, pestana activa,
  etiqueta PUSH, la linea de la grafica. En oscuro es mas claro (#f97043, 5,7:1
  sobre las tarjetas); en claro es mas oscuro (#c2410c). El de relleno usado como
  texto sobre el fondo oscuro se queda en 3,5:1.

Los grises salen del azul marino de la marca (`--marca-marino`), no de una paleta
generica: asi la cabecera y el cuerpo son la misma familia de color.

Los colores de la ventana flotante estan aparte, en `COLOR_FASE_PIP` de
`js/tiempo.js`: van sobre canvas, no heredan CSS, y el texto siempre es blanco,
asi que cada uno tiene que dar 4,5:1 con el blanco.

Dos pruebas de `tests/tests.js` vigilan todo esto en los dos temas; si tocas un
color y bajas de 4,5:1, fallan.

## Escalas visuales (v1.6.0+)
Ninguna regla de `styles.css` elige ya un numero a ojo: todo sale de las
variables de `:root`.
- Letra: `--t-xs` 11 · `--t-s` 13 · `--t-m` 15 · `--t-l` 18 · `--t-xl` 22 (+ `--t-crono` 54).
- Espacio: `--e-1` 4 · `--e-2` 8 · `--e-3` 12 · `--e-4` 16 · `--e-5` 24 · `--e-6` 32.
- Redondeo: `--r-s` 8 · `--r-m` 12 · `--r-l` 16 · `--r-full` (pastilla).
- Profundidad: `--sombra-1` (tarjetas) y `--sombra-2` (diálogos), mas suaves en tema claro.
- Movimiento: una sola duración, `--transicion` (150 ms).
Los 2-3px sueltos que quedan son ajustes ópticos de un sitio concreto, no huecos
de maquetación. **Al añadir estilos, usar la escala; no inventar valores nuevos.**

## Modelo de datos (real, clave localStorage `gym.datos.v1`)
- `ejercicios`: [{ id, nombre, grupo, nota, medida }]
  - `grupo` de lista fija `GRUPOS_MUSCULARES` (Pecho, Espalda, Pierna, Hombro, Bíceps, Tríceps, Core, Otro)
  - `medida`: `"reps"` (por defecto) o `"tiempo"` — ver "Unidad de un ejercicio"
- `rutinas`: [{ id, nombre, division, items: [{ exerciseId, series, reps, peso, descansoSeg, nota }] }]
  - `division` opcional, lista fija `DIVISIONES` (Full Body, Push, Pull, Pierna, Torso, Superior, Inferior, Otro); "" = sin división
  - `reps` es texto libre corto: "10" o rango "8-12"
- `sesiones`: [{ id, routineId, fecha, sets: [{ exerciseId, serie, pesoReal, repsReal }] }]

### Unidad de un ejercicio (v1.9.0+)
Un ejercicio se anota en **repeticiones** o en **segundos** (dead hang, plancha).
`medida` vive en el EJERCICIO, no en el item de la rutina. Dos motivos:
1. Un dead hang se mide en segundos siempre, en todas las rutinas.
2. **Los `sets` del historial solo guardan `exerciseId`**, no de qué rutina
   salieron (a propósito: borrar o editar una rutina no debe romper el
   historial). Si la unidad viviera en la rutina, Progreso no podría saber
   nunca si está mirando segundos o repeticiones.

El número se sigue guardando en `repsReal`: el campo dice *cuántas unidades* y
`medida` dice *de qué*. Así no hay que migrar nada. `empezarSesion` **copia** la
unidad a `sesionActiva.ejercicios[].porTiempo`, igual que el nombre, para que
editar la ficha a mitad de entreno no cambie lo que estás anotando.

Los textos salen todos de `formato.js`: `seMidePorTiempo`, `textoObjetivo`,
`textoUltimaSerie`, `conUnidad`.

### Métricas de Progreso (v1.9.0+)
`metricasDeEjercicio(exerciseId)` en `consultas.js` decide qué botones salen,
mirando dos cosas: si el ejercicio es por tiempo (su ficha) y si **alguna vez se
ha anotado peso** (se deduce del historial, no de un flag: el día que lastres los
fondos, el peso aparece solo).

| Caso | Botones |
|---|---|
| Con peso | Peso máx. · Volumen · 1RM est. |
| Sin peso, por reps | Reps máx. · Reps totales |
| Por tiempo | Tiempo máx. · Tiempo total (+ Peso máx. si lo lastras) |

**Por qué existía el problema:** las tres métricas de siempre se calculan a partir
del peso. Con peso 0 las tres valen 0 **para siempre**, así que Progreso era una
raya en el cero para toda la calistenia aunque pasaras de 6 a 12 dominadas.
Máximo tres botones: es lo que cabe en el conmutador de un móvil.

### Qué cuenta como serie hecha (v1.8.0+)
`serieRegistrada(fila)` en `consultas.js`: **una serie cuenta en cuanto tiene
repeticiones**. El peso es opcional y se guarda como 0 si está en blanco.

El peso NO entra en la cuenta a propósito: las repeticiones son lo que dice que
la serie ha ocurrido, el peso es un dato de esa serie. Si se exigieran los dos,
los ejercicios de peso corporal (fondos, dominadas, toda la calistenia) se
perderían en silencio al terminar el entreno.

Hasta la v1.7.0 había además una casilla para marcar cada serie a mano. Se quitó:
si rellenas la fila ya está hecha, y nadie la tocaba nunca. El campo `hecha` que
quede en datos antiguos se ignora. La red de seguridad es el recuento del aviso
al pulsar "Terminar" ("Se guardarán N series"): si hiciste 19 y pone 12, es que
en 7 filas faltan las repeticiones.

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

## Al publicar (checklist)
- Subir la versión en **dos sitios** (deben coincidir):
  `js/version.js` → `APP_VERSION` y `sw.js` → `const CACHE = "gymbe-v<versión>"`.
  El `CACHE` nuevo hace que el navegador vea un `sw.js` distinto: el service
  worker nuevo se activa solo (`skipWaiting` + `clients.claim`) y `js/app.js`
  recarga la página al tomar el control (o muestra la barra "Actualizar" si hay
  un entreno a medias). Si no cambias el `CACHE`, la actualización no se detecta.
- `npm test` en verde antes de mergear (incluye el smoke test: la app tiene que
  arrancar sin ningún error de consola).
- `npm run tipos` también en verde. Revisa los archivos marcados con `// @ts-check`
  (ahora `datos.js` y `aviso-version.js`). No compila nada: la app sigue siendo JS
  normal. `npm run comprobar` hace las dos cosas.
