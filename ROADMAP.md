# GYM APP — Plan de desarrollo

App personal para registrar y seguir mi progreso en el gimnasio.

## Qué queremos (resumen)

- Rutinas guardadas: unas que definimos nosotros + otras que creo y personalizo yo.
- **Sin plantillas de ejercicios**: los ejercicios los escribo yo a mano.
- Al añadir un ejercicio a una rutina puedo definir: nº de series, tipo/tiempo de descanso,
  nº de repeticiones o rango de repeticiones, peso, y una nota de texto libre.
- Registrar cada entrenamiento y ver la **evolución** (peso y repeticiones a lo largo del tiempo).
- **Historial**: una pestaña para consultar los últimos entrenamientos realizados.
- Cada rutina tiene una **división** (Full Body, Push, Pull, Pierna, Torso…) visible en la app.
- **Cronómetro** (cuenta hacia arriba) para medir cuánto dura un ejercicio.
- **Temporizador** (cuenta atrás) para los descansos, con aviso.
- Visualmente sencilla. Funciona en Android; se prueba también en el PC.
- **Offline** y **sin nube**. Los datos viven en el propio dispositivo.
- **Exportar / importar** toda la base de datos con un archivo, de forma fácil.
- **Modo oscuro y modo diurno**, elegibles desde Ajustes.

## Decisiones técnicas (ya tomadas)

| Tema | Decisión | Por qué |
|------|----------|---------|
| Tipo de app | **PWA** (web instalable) | Se prueba abriendo el navegador, se instala en Android desde Chrome, funciona offline. Sin programas raros que instalar. |
| Lenguajes | HTML + CSS + JavaScript "a pelo" | Lo más sencillo de entender y mantener siendo principiante. Sin pasos de compilación. |
| Dónde se guardan los datos | En el navegador del dispositivo (`localStorage`) | No necesita servidor ni internet. |
| Copias de seguridad | Exportar/importar un archivo `.json` | Control total, sin nube. |
| Idioma de la interfaz | Español | |
| Unidad de peso | Kilogramos (kg) | |
| Gráficas | Librería ligera guardada en el propio proyecto | Para que funcione sin internet. |

## Cómo trabajamos

- Vamos **por fases**. No pasamos a la siguiente hasta que la actual funciona y la entiendes.
- Al final de cada fase: **la probamos en el PC** y, de vez en cuando, en el móvil.
- Hay **pruebas automáticas** en `tests/tests.html`: cada paso que toque la lógica de datos
  añade sus pruebas y todas deben seguir en verde antes de continuar.
- En cada fase te explico *qué* hacemos y *por qué*, con lenguaje llano.
- Si algo no se entiende, paramos y lo aclaramos antes de seguir.
- El código lo escribo yo, pero tú decides y revisas.

---

## Fases

### Fase 0 — Preparación  ✅ (en marcha)
**Objetivo:** tener el proyecto montado y saber cómo mirarlo.
- Crear la estructura de carpetas.
- Inicializar control de versiones (git) para poder deshacer cambios.
- Crear este `ROADMAP.md` y un `CLAUDE.md` (notas del proyecto).
- Un esqueleto de la app que ya se abre y se puede navegar (aún sin funciones).
- **Aprendes:** cómo abrir el proyecto y verlo en el navegador.

### Fase 1 — Esqueleto y navegación
**Objetivo:** que se vea la app y se pueda moverse entre secciones.
- Menú inferior con: Rutinas · Entrenar · Historial · Progreso · Tiempo · Ajustes.
- Cada sección es una pantalla vacía por ahora.
- Estilos base (colores, tipografía, que se vea bien en móvil).
- **Aprendes:** cómo está organizado un archivo HTML/CSS/JS y cómo se "sirve" una web en local.

### Fase 2 — Ejercicios y rutinas
**Objetivo:** poder crear mi biblioteca de ejercicios y mis rutinas.
- Pantalla para crear / editar / borrar **ejercicios**: nombre, grupo muscular (lista fija) y nota opcional.
- Pantalla para crear **rutinas** y añadirles ejercicios.
- Cada rutina tiene una **división** opcional (lista fija: Full Body, Push, Pull, Pierna,
  Torso, Superior, Inferior, Otro), que se muestra visiblemente en la rutina.
- Por cada ejercicio dentro de una rutina: series, repeticiones o rango (`10` o `8-12`),
  peso objetivo (kg), descanso en segundos (con botones rápidos), nota.
- Poder reordenar y quitar ejercicios de una rutina.
- Todo se guarda en el dispositivo (sigue ahí al cerrar y abrir).
- **Aprendes:** cómo se representan y guardan los datos (listas y fichas de información).

### Fase 3 — Registrar un entrenamiento
**Objetivo:** usar la app durante el entreno.
- Elegir una rutina y pulsar "Empezar".
- Ir marcando series hechas y anotar el peso y las repes reales de cada serie.
- Al terminar, se guarda la sesión con su fecha.
- **Aprendes:** el "estado" de la app y el manejo de formularios.

### Fase 4 — Historial
**Objetivo:** consultar de un vistazo lo que he entrenado.
- Pestaña **Historial** con la lista de entrenamientos realizados, del más reciente al más antiguo.
- Cada entrada muestra: fecha, rutina, y un resumen (ejercicios, series, peso).
- Tocar una entrada abre el detalle completo de esa sesión.
- Poder borrar una sesión concreta.
- **Aprendes:** ordenar y mostrar listas de datos guardados.

### Fase 5 — Cronómetro y temporizador
**Objetivo:** las dos herramientas de tiempo.
- Cronómetro que cuenta hacia arriba (para medir un ejercicio).
- Temporizador de descanso que cuenta atrás, con sonido y/o vibración al llegar a 0.
- Poder lanzarlo rápido desde la pantalla de entrenamiento.
- **Aprendes:** cómo se maneja el tiempo en JavaScript.

### Fase 6 — Progreso y gráficas
**Objetivo:** ver la evolución.
- Elegir un ejercicio y ver su progreso: peso máximo, volumen total, repeticiones, por fecha.
- Una gráfica sencilla.
- **Aprendes:** agrupar y resumir datos; usar una librería de gráficas.

### Fase 7 — Ajustes: exportar / importar y tema
**Objetivo:** copias de seguridad, mover datos entre dispositivos y elegir el aspecto.
- Botón **Exportar**: descarga un `.json` con absolutamente todo.
- Botón **Importar**: cargar ese archivo (con aviso antes de sobrescribir).
- **Modo oscuro / modo diurno**: interruptor en Ajustes para cambiar entre tema oscuro
  (el actual) y tema claro. Se recuerda la elección en el dispositivo. Opción "según el
  sistema" para seguir la preferencia del móvil.
- **Aprendes:** leer y escribir archivos desde el navegador; variables de color y temas.

### Fase 8 — Hacerla instalable (PWA) y pulir
**Objetivo:** que se instale en Android y funcione 100% offline.
- Icono, nombre, color de tema.
- "Service worker" para que cargue sin internet.
- Repaso de detalles visuales y de uso.
- Sustituir los avisos del navegador (`confirm`/`alert`) por mensajes dentro de la app.
- Versión pequeña y más simple del icono para tamaños diminutos (favicon, cabecera).
- **Aprendes:** qué es exactamente una PWA.

### Fase 9 — Rutinas pregrabadas y uso real
**Objetivo:** cargar mis rutinas de verdad y empezar a usarla en serio.
- Metemos como datos iniciales las rutinas que definamos juntos.
- Ajustes según lo que note usándola.

---

## Estado actual

- [x] Fase 0 — Preparación
- [x] Fase 1 — Esqueleto y navegación
- [x] Fase 2 — Ejercicios y rutinas
- [x] Fase 3 — Registrar entrenamiento
- [x] Fase 4 — Historial
- [x] Fase 5 — Cronómetro y temporizador
- [x] Fase 6 — Progreso y gráficas
- [x] Fase 7 — Ajustes: exportar / importar y tema (claro/oscuro)
- [x] Fase 8 — PWA y pulido
- [x] Fase 9 — Rutinas pregrabadas y uso real

Versión 1.5.0 (2026-09-11): cierre del PLAN-MEJORAS.md (fase B y remates).
- B2: índice de sets por ejercicio en consultas.js. mejorSerieUltimoDia pasa de
  recorrer y reordenar TODO el historial una vez por ejercicio y por repintado a
  una búsqueda directa. Medido con 200 sesiones: 2,47 ms -> 0,005 ms por
  repintado (el primero sigue costando 2,4 ms, que es construir el índice).
- B3: el bucle de pintado (10 veces por segundo) solo corre cuando hay cronómetro
  o temporizador en marcha. Antes no paraba nunca, ni en Historial sin nada activo.
- B4: la ventana flotante se redibuja solo cuando cambia el segundo que muestra.
- A4: importarDatos comprueba la FORMA de la copia, no solo que existan las tres
  listas. Una copia corrupta se rechaza diciendo qué falla, en vez de entrar y
  romper la app después al pintar.
- E2: el runner de pruebas admite funciones async (se pueden probar esperas).
- D4/D5: foco visible con teclado (:focus-visible), aria-live en la cuenta atrás y
  respeto a prefers-reduced-motion.

Corrección al propio plan: decía que cada tick hacía un document.querySelector
dentro de pintarPildora. Es FALSO, las referencias ya estaban cacheadas.

NO se hace C1 (módulos ES), C3 (bus de eventos), C4 (delegación) ni A3
(migraciones), a propósito. Ver la nota al final de PLAN-MEJORAS.md.

Versión 1.4.5 (2026-09-11): paso 5 del PLAN-MEJORAS.md (C2, arquitectura).
datos.js pasa de 674 líneas con 8 responsabilidades mezcladas a seis archivos:
  datos.js (265)        el almacén: cargar/guardar, preferencias, tema, export/import
  entidades.js (258)    ejercicios, rutinas y entrenamientos (el CRUD)
  consultas.js (93)     lecturas derivadas: progreso, mejor marca, filtros
  formato.js (70)       texto, números y tiempo (funciones puras)
  grafica.js (58)       matemática de los ejes
  temporizador.js (45)  configuración, tramos y avisos
Sin cambios de comportamiento: se movió código, no se reescribió (verificado con un
recuento línea a línea: 0 perdidas). El smoke test cazó en su primer uso real un
fallo de la partición (un listener quedaba en un archivo que cargaba antes que la
función que usaba).

Versión 1.4.4 (2026-09-11): paso 4 del PLAN-MEJORAS.md (fase E, herramientas).
- E1: comprobación de tipos con "npm run tipos" (TypeScript en modo revisión, sin
  compilar nada: la app sigue siendo JavaScript normal y sin dependencias en
  tiempo de ejecución). Se aplica ARCHIVO A ARCHIVO con "// @ts-check": de momento
  datos.js y aviso-version.js, que son la lógica. Las vistas se quedan fuera a
  propósito: exigirían ~60 anotaciones de tipos del DOM y harían el código más
  difícil de leer, que va contra el principio número uno del proyecto.
  Nota honesta: al activarlo NO aparecía ningún bug real. Su valor es preventivo.
- E3: smoke test en el CI. Abre la app de verdad y falla si suelta cualquier error
  de consola o excepción, y comprueba que arranca (versión, 4 pestañas, rutinas
  sembradas). Comprobado que caza tanto un console.error como una excepción.
- Se quita un bloque "module.exports" muerto de aviso-version.js (nada lo usaba).

Versión 1.4.3 (2026-09-11): paso 3 del PLAN-MEJORAS.md (fase D, diseño).
- D1: el texto sobre el naranja de marca pasa de blanco (3,16:1, NO cumple AA) al
  token --sobre-acento que ya existía (5,72:1). Afectaba a TODOS los botones
  primarios, la píldora del descanso, la barra "Entrenamiento en curso" y el
  aviso de versión. El conmutador activo ya lo usaba, así que ahora es coherente.
  El botón "Actualizar" del aviso (naranja sobre blanco, también 3,16:1) pasa a
  marino sobre blanco. El rojo de peligro se queda con blanco: ya daba 4,83:1.
- D2: los botones de icono pasan de 29x26 px a 40x40 y con 4 px de separación.
  En el editor de rutinas ✏️ y 🗑️ estaban pegados (0 px): era fácil borrar un
  ejercicio queriendo editarlo. El engranaje de la cabecera, de 30x30 a 44x44.
  Un margen negativo evita que el área táctil mayor estire las filas.
- 2 pruebas nuevas que miden el contraste y el tamaño reales inyectando el CSS,
  así que la regresión no puede colarse.

Versión 1.4.2 (2026-09-10): paso 2 del PLAN-MEJORAS.md (fase B, rendimiento).
- B1: el entreno ya no se guarda en cada tecla. Al escribir peso/reps se guarda
  400 ms después de la última pulsación; al marcar una serie, añadirla o quitarla
  se guarda al instante. Red de seguridad en "pagehide" y "visibilitychange" a
  oculto, por si cierras la app con algo en cola. Medido con ~1 año de historial
  (626 KB): teclear "57.5" y "8" pasaba de 6 escrituras (~22 ms de bloqueo del
  hilo principal) a 0 mientras tecleas y 1 al marcar la serie.
- B5: el arranque ya no parsea todo el almacén para saber el tema. Se guarda un
  espejo diminuto en "gym.tema" con la PREFERENCIA (no el color resuelto, para
  que "sistema" siga al móvil); el script anti-parpadeo del <head> lo lee y solo
  tira del almacén grande la primera vez, y ya parseándolo una sola vez en vez
  de dos.

Versión 1.4.1 (2026-09-10): los tres bugs latentes del PLAN-MEJORAS.md (fase A).
- `guardar()` ya no revienta si el almacenamiento está lleno: devuelve `false`,
  avisa una sola vez (exporta una copia / borra historial) y la app sigue viva
  en memoria. Antes, un `QuotaExceededError` subía por las 25 llamadas a guardar.
- `borrarTodosLosDatos()` bloquea cualquier guardado hasta la recarga. Si algo
  guardaba entremedias, la clave volvía a existir, `ES_PRIMERA_VEZ` pasaba a
  false y no se re-sembraban las rutinas iniciales. También borra ya la clave
  del temporizador (`gym.tiempo.v1`), que antes sobrevivía a "borrar todo".
- `_sinTildes()` usa escapes Unicode (`\u0300-\u036f`) en vez de las marcas
  combinantes escritas literales, que son invisibles en el editor y se pierden
  si el archivo se reguarda con otra codificación (rompería el buscador).

Tests (2026-09-09, sin cambio de versión): +7 pruebas tapando huecos del harness —
cargar() rellena defaults en datos antiguos / aguanta JSON roto, trim de reps/nota
y del nombre de rutina, htmlEtiquetaDivision, terminarSesion sin sesión activa,
empezarSesion con ejercicio borrado. 74 en total.

Versión 1.4.0 (2026-09-09): al añadir un ejercicio a una rutina, el desplegable se
cambia por un buscador: escribes y salen las coincidencias de tu biblioteca
(ignora mayúsculas y tildes); si no hay ninguna igual, aparece "+ Crear «X»" que
lo crea al vuelo pidiendo solo el grupo muscular (recuerda el último en
prefs.grupoPorDefecto). Ya no hace falta pasar por la subpestaña Ejercicios antes.
filtrarEjercicios() en datos.js.

Versión 1.3.0 (2026-09-09): en el editor de rutinas, los ejercicios se reordenan
arrastrando (pulsación larga ~350 ms → el ejercicio sigue al dedo → soltar guarda
el orden). Sin librerías, con eventos de puntero (dedo y ratón). Se quitan las
flechas ▲▼. reordenarItem() en datos.js; la lógica de arrastre en rutinas.js.

Versión 1.2.2 (2026-09-09):
- Detalle de rutina: el botón "Empezar entrenamiento" va FIJO abajo (antes había
  que hacer scroll hasta el final). "Editar rutina" pasa a un ✏️ en la cabecera.
- Ventana flotante (PiP): tipografía a dos alturas — la fase arriba en versalitas
  espaciadas y translúcidas, el tiempo abajo grande y en negrita.

Versión 1.2.1 (2026-09-09): la ventana flotante (PiP) se pinta como la píldora de
dentro de la app: fondo del color de la fase, centrado (Android redondea las
esquinas). Proporción 2.39:1 (lo más plano que Chrome-Android permite).

Versión 1.2.0 (2026-09-09):
- Fusión Rutinas + Entrenar en una sola pestaña "Entrenar" (menú a 4 pestañas).
  Tocar una rutina -> detalle "ver" (solo lectura + "última: X kg × Y" + botón
  "Empezar entrenamiento" + enlace "Editar rutina"). "Editar rutina" -> modo
  edición. El panel de entreno en curso vive dentro de esa vista; barra
  "Entrenamiento en curso" para volver desde otras pestañas. Aviso si empiezas
  otra rutina con un entreno ya en curso (conflictoDeSesion en datos.js).
- Ventana flotante del temporizador: tira 3:1 (288×96) en vez de recuadro 16:9.
- Arreglo: [hidden] y .oculta ahora llevan display:none !important (una regla
  display:flex posterior con la misma especificidad los ignoraba).

Versión 1.1.0 (2026-09-09):
- Entrenar: campo "Reps" con teclado numérico; la serie se marca sola al rellenar
  peso y reps (nunca se desmarca sola); bajo el objetivo, "última: 60 kg × 8"
  (mejor serie del último día). datos.js: mejorSerieUltimoDia(), debeMarcarSerie().
- Tiempo: dos sub-pestañas (Temporizador | Cronómetro). El botón "⏱ Temporizador"
  de Entrenar lleva el ejercicio/reps/peso y se muestra en el temporizador.
- Temporizador: el pitido de fin de descanso se programa con Web Audio (suena con
  el móvil bloqueado); botón "📺 Ventana flotante" (Picture-in-Picture) con la
  cuenta atrás encima de otras apps, si el navegador lo permite.

Versión 1.0.1 (2026-09-07): arreglo de la barra "Versión nueva" que se veía siempre.
Causa real: en css/styles.css, `.aviso-version { display:flex }` ganaba a la regla
`[hidden]{display:none}` del navegador (misma especificidad, venía después), así que el
atributo `hidden` no ocultaba nada. Solución: regla global `[hidden]{display:none!important}`.
Además, mejora del service worker: ya no espera, se activa solo (skipWaiting + clients.claim)
y js/app.js recarga la página cuando el SW nuevo toma el control (decidirActualizacion en
js/aviso-version.js) — salvo que haya un entreno en curso, entonces muestra la barra.

Versión 1.0 (2026-09-07): 9 rutinas reales del usuario como datos iniciales (js/ejemplos.js),
sin historial de ejemplo. Opción "registro simple" en Ajustes (una fila por ejercicio en
Entrenar).

