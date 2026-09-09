# Plan de mejora — Gymbe App v1.4.0

> Revisión de arquitectura, rendimiento y diseño. 2026-09-09.
> Respuesta al prompt de `PROMPT-OPUS.md`. **Es un plan, no un cambio de código.**

## Veredicto

**La app está sana y no necesita reescritura.** Para lo que es —una PWA personal de
~2.900 líneas, sin dependencias, que funciona y que usas de verdad en el gimnasio—
las decisiones de fondo son buenas: datos por marca de tiempo, historial
denormalizado, disciplina de pruebas, cero dependencias.

Lo que hay son **tres cosas que sí merecen la pena** y un montón de pulido opcional.
He medido lo que se podía medir en vez de opinar. Lo ordeno por impacto ÷ esfuerzo.

---

## Lo que medí (no son suposiciones)

| Medición | Resultado | Lectura |
|---|---|---|
| `guardar()` completo con ~1 año de historial (626 KB, 200 sesiones) | **3,69 ms** en PC | Se ejecuta **en cada tecla** al meter peso/reps. En un móvil de gama media son 15-40 ms de bloqueo del hilo principal → lag al escribir. **El hallazgo más importante.** |
| `mejorSerieUltimoDia()` × 6 ejercicios (un render del detalle) | **2,47 ms** con 200 sesiones | Hoy es irrelevante. Crece lineal con el historial: en 3-4 años son 8-10 ms en PC, 40-80 en móvil. |
| `progresoDeEjercicio()` | 0,41 ms | Sin problema. |
| Contraste `--texto-suave` (ambos temas) | 5,78 / 6,99 / 4,83 : 1 | ✅ Pasa AA. **Me equivocaba al sospechar de esto.** |
| Contraste **blanco sobre naranja `--acento`** | **3,16 : 1** | ❌ **No pasa AA** (necesita 4,5). Afecta a la píldora del descanso, la barra de entreno y el aviso de versión. |
| Contraste `--sobre-acento` sobre `--acento` | 5,72 : 1 | ✅ El token correcto **ya existe**, solo que en esos tres sitios se escribió `#fff` a mano. |
| Tamaño del almacén tras ~1 año | 626 KB | El límite de `localStorage` suele ser 5 MB → margen de ~8 años. Pero `guardar()` **no captura `QuotaExceededError`**. |

---

## Fase A — Robustez de los datos

*Lo primero, porque es lo único que puede hacerte perder entrenamientos.*

| # | Qué | Esfuerzo | Riesgo | Impacto |
|---|---|---|---|---|
| **A1** | `guardar()` no tiene `try/catch`. Si un día se llena la cuota, `localStorage.setItem` lanza y la excepción sube por *todas* las mutaciones → la app se rompe en silencio. Curioso: `guardarEstadoTiempo()` en `tiempo.js` **sí** está protegido; el guardado principal no. → envolver en `try/catch` y avisar al usuario ("no se pudo guardar, exporta una copia"). | S | Bajo | **Alto** |
| **A2** | `borrarTodosLosDatos()` hace `DATOS = datosVacios()` + `removeItem()` pero **no persiste**. Hoy funciona porque `ajustes.js` recarga inmediatamente después, pero si algún día un temporizador llama a `guardar()` entre medias, el almacén queda con datos vacíos y `ES_PRIMERA_VEZ` pasa a `false` → **no se re-siembran los ejemplos y te quedas sin biblioteca de ejercicios**. Es exactamente el síntoma que ya viste. → hacer la función autocontenida y no depender del `reload`. | S | Bajo | **Alto** |
| **A3** | No hay migraciones de esquema. La clave dice `v1` pero `cargar()` solo hace `Object.assign` de valores por defecto: si mañana cambia la forma de un `item` o un `set`, los datos viejos se rompen sin avisar. → añadir `esquema: 1` a los datos y un pequeño runner `migraciones[1→2]`. | M | Medio | Medio-alto |
| **A4** | `importarDatos()` solo comprueba que existan tres arrays. Una copia corrupta o de otra app entra tal cual y envenena el estado. → validar la forma mínima de `items` y `sets`, y comprobar el campo `version` que `exportarDatos()` ya escribe pero nadie lee. | S | Bajo | Medio |

---

## Fase B — Rendimiento donde se nota

| # | Qué | Esfuerzo | Riesgo | Impacto |
|---|---|---|---|---|
| **B1** | **Debounce del guardado del entreno.** Hoy cada pulsación de tecla serializa los ~626 KB completos. → guardar 400 ms después de la última tecla, **inmediato** al marcar ✓ / añadir serie / terminar, y un `pagehide` que fuerce el guardado por si cierras la app. | S | Bajo | **Alto** — es el único que notas con el dedo |
| **B2** | Índice de sets por ejercicio para `mejorSerieUltimoDia` y `progresoDeEjercicio` (hoy recorren y **reordenan todo el historial una vez por ejercicio y por render**). | M | Bajo | Bajo hoy, alto en 2-3 años |
| **B3** | `setInterval(tick, 100)` corre siempre, 10×/s, aunque no haya nada en marcha y estés en Historial. Cada tick hace además un `document.querySelector` dentro de `pintarPildora`. → arrancar/parar el bucle según haya cronómetro o temporizador activo, parar con `visibilitychange`, cachear la referencia. | S | Bajo | Bajo-medio (batería) |
| **B4** | PiP: `dibujarPiP()` en cada tick mientras la ventana flotante está abierta. → redibujar solo cuando cambia el segundo mostrado. | S | Bajo | Bajo |
| **B5** | El script anti-parpadeo del `<head>` hace `JSON.parse(gym.datos.v1)` **dos veces** (626 KB parseados dos veces antes del primer pixel). → parsear una vez a una variable. | S | Bajo | Medio en el arranque |

> **B5 merece un ascenso:** parsear 626 KB dos veces en el camino crítico del primer
> render es más caro que casi todo lo demás de esta fase, y arreglarlo son 3 líneas.

---

## Fase C — Arquitectura

*Nada de esto se nota usando la app. Se nota al cambiarla.*

| # | Qué | Esfuerzo | Riesgo | Impacto |
|---|---|---|---|---|
| **C1** | **ES modules nativos** (`<script type="module">` + `import`/`export`). **No introduce build ni dependencias.** Elimina el scope global (donde hoy conviven `_arrastre`, `_pipCanvas`, `_audioCtx`…), las guardas `typeof X === "function"` y la fragilidad del orden de los 14 `<script>`. | M | Medio | Alto a largo plazo |
| **C2** | **Partir `datos.js` (669 líneas).** Hoy mezcla: almacenamiento, CRUD de 3 entidades, preferencias, tema, formateadores, matemática de la gráfica, tramos del temporizador y avisos de audio. → `almacen.js`, `entidades.js`, `formato.js`, `grafica.js`, `temporizador.js`. | M | Bajo | Alto |
| **C3** | Bus de eventos mínimo (~25 líneas) para dejar de tener que **acordarse** de qué `pintarX()` llamar tras cada mutación. De ese olvido salieron ya varios bugs ("se me olvidó `actualizarBarraEntreno`"). | M | Medio | Medio-alto |
| **C4** | Delegación de eventos en las listas (un listener en el contenedor) en vez de re-enganchar uno por elemento en cada `innerHTML = ""`. | M | Bajo | Medio |

---

## Fase D — Diseño

| # | Qué | Esfuerzo | Riesgo | Impacto |
|---|---|---|---|---|
| **D1** | **Blanco sobre naranja falla AA (3,16:1).** Afecta a la píldora del descanso, la barra "Entrenamiento en curso" y el aviso de versión — justo los elementos que miras de reojo, sudando, entre series. El token correcto (`--sobre-acento`, 5,72:1) ya existe. → sustituir los `#fff` por el token, o aclarar el naranja. | S | Bajo | **Medio-alto** (contexto de uso real) |
| **D2** | **Objetivos táctiles pequeños:** los `.icono-boton` (✏️ 🗑️) tienen `padding: 3px 4px` → muy por debajo de los 44 px recomendados. Otra vez: manos sudadas, prisa. | S | Bajo | Medio |
| **D3** | **Sin sistema de tokens** más allá de los colores: **12 tamaños de fuente distintos** (10,11,12,13,14,15,16,17,18,20,22,54 px), **11 paddings** y **6 radios** sin escala. → definir `--esp-1..5`, `--radio-s/m/l`, `--txt-xs..xxl` y sustituir progresivamente. | M | Bajo | Medio |
| **D4** | Accesibilidad: `aria-live="polite"` en la cuenta atrás, `role="combobox"` + `aria-expanded` en el buscador de ejercicio, `:focus-visible` visible. | M | Bajo | Bajo (usuario único) pero barato |
| **D5** | `@media (prefers-reduced-motion: reduce)` para el FLIP del arrastre, el splash y la píldora. | S | Bajo | Bajo |

---

## Fase E — Herramientas

| # | Qué | Esfuerzo | Riesgo | Impacto |
|---|---|---|---|---|
| **E1** | **`// @ts-check` + JSDoc + `tsc --checkJs` en CI.** Sin build, sin dependencia de runtime, sin cambiar una línea de lógica. Pillaría typos, argumentos mal pasados y contratos rotos entre archivos — que es exactamente el riesgo de tener todo en scope global. | M | Bajo | **Alto** |
| **E2** | Soporte `async` en el runner de pruebas (hoy es síncrono, así que nada asíncrono —SW, PiP, temporizadores, arrastre— es testeable). | S | Bajo | Medio |
| **E3** | Smoke test en CI: cargar `index.html` y fallar si hay **cualquier** error de consola. Habría cazado varios de los bugs de esta semana. | S | Bajo | Medio |

---

## Bocetos: antes → después

### 1. Debounce del guardado (B1) — el de mejor relación impacto/esfuerzo

```js
// datos.js — ANTES
function guardarSesionActiva() {
  guardar();                     // JSON.stringify de TODO, en cada tecla
}

// datos.js — DESPUÉS
let _guardadoPendiente = null;

function guardarSesionActiva({ inmediato = false } = {}) {
  clearTimeout(_guardadoPendiente);
  if (inmediato) return guardar();
  _guardadoPendiente = setTimeout(guardar, 400);
}

// Y una red de seguridad: si cierras la app con un guardado pendiente, se fuerza.
window.addEventListener("pagehide", () => {
  clearTimeout(_guardadoPendiente);
  guardar();
});
```

En `entrenar.js`: al escribir en peso/reps → normal (debounce). Al marcar ✓,
al añadir/quitar serie y al terminar → `guardarSesionActiva({ inmediato: true })`.

### 2. Estructura de archivos (C1 + C2)

```
ANTES                              DESPUÉS
index.html                         index.html
  14 × <script src=...>              1 × <script type="module" src="js/app.js">
js/                                js/
  datos.js      669  ← todo         datos/
  version.js      3                   almacen.js      cargar/guardar/migrar/exportar
  ejemplos.js   174                   entidades.js    ejercicios · rutinas · sesiones
  dialogos.js    43                   consultas.js    progreso · mejorSerieUltimoDia (+índice)
  ejercicios.js 115                 lib/
  rutinas.js    576                   formato.js      cronómetro · cuenta atrás · etiquetas
  entrenar.js   295                   grafica.js      marcasEjeY · indicesEtiquetasX
  historial.js  154                   temporizador.js construirSegmentos · avisosDelTramo
  progreso.js   181                   bus.js          emitir/escuchar (C3)
  tiempo.js     548                 vistas/
  aviso-version.js 21                 entrenar.js · rutinas.js · historial.js
  ajustes.js     89                   progreso.js · tiempo.js · ajustes.js · ejercicios.js
  app.js        159                 app.js            navegación + service worker
```

Sin `package.json` nuevo, sin bundler, sin transpilar: los navegadores cargan
`import`/`export` de forma nativa desde hace años. **Ojo:** los módulos ES no
funcionan con `file://`, así que hay que abrir siempre por `node server.js` — que
ya es lo que haces. Y `tests/tests.html` tendría que importar igual.

### 3. Índice de sets (B2)

```js
// consultas.js
let _indice = null;   // exerciseId -> sets (de la sesión más reciente a la más antigua)

function indice() {
  if (_indice) return _indice;
  _indice = new Map();
  [...DATOS.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .forEach((ses) => ses.sets.forEach((s) => {
      if (!_indice.has(s.exerciseId)) _indice.set(s.exerciseId, []);
      _indice.get(s.exerciseId).push({ ...s, fecha: ses.fecha, sesionId: ses.id });
    }));
  return _indice;
}

function invalidarIndice() { _indice = null; }
// llamarlo desde terminarSesion(), borrarSesion() e importarDatos()
```

`mejorSerieUltimoDia` pasa de recorrer + reordenar todo el historial **por cada
ejercicio y por cada render** a una búsqueda directa.

---

## Qué dejaría igual (y por qué)

- **Cero dependencias y sin build.** Es la mejor decisión del proyecto: dentro de
  cinco años esta app seguirá abriéndose y siendo editable. Nada de lo propuesto
  aquí la rompe.
- **`localStorage` en vez de IndexedDB.** Con 626 KB tras un año y 5 MB de límite
  tienes ~8 años de margen. IndexedDB sería asíncrono y contagiaría `async` a todo
  el código a cambio de nada.
- **El temporizador por marca de tiempo (`Date.now`)** y los pitidos programados con
  Web Audio. Es la parte más lista del código y sobrevive a que el móvil congele los
  `setInterval`. **No tocar.**
- **El historial denormalizado** (cada sesión guarda su propio nombre, división y
  objetivos). Es lo que hace que editar o borrar una rutina no corrompa el pasado.
- **El runner de pruebas casero.** 60 líneas, cero dependencias, hace su trabajo.
  Solo le añadiría `async`.
- **El renderizado con `innerHTML` + reconstruir.** Es "poco elegante" pero a esta
  escala funciona y se lee de un vistazo. Cambiarlo por un sistema reactivo propio
  sería reinventar un framework: mucho riesgo, poco premio. Solo delegación de
  eventos (C4), que es barato.
- **La gráfica SVG dibujada a mano.** Meter una librería de gráficas costaría más
  KB que toda la app.
- **`.oculta` / `[hidden]` con `!important`.** Parece sucio pero es la solución
  correcta a un problema real que ya te mordió tres veces.

---

## Bugs latentes encontrados de paso

1. **`guardar()` sin `try/catch`** → cuota llena rompe la app en silencio (A1).
2. **`borrarTodosLosDatos()` no persiste** → estado incoherente si algo guarda antes
   de la recarga (A2). Hoy no se dispara, pero es una trampa esperando.
3. **`_sinTildes()` lleva el rango de tildes escrito con caracteres literales** en
   su expresión regular: en el código fuente se ven como marcas sueltas invisibles.
   Funciona, pero si el archivo se reguarda con otra codificación deja de funcionar
   y el buscador de ejercicios se rompe sin avisar. Debería escribirse con escapes
   Unicode, que es exactamente el mismo rango pero visible e indestructible:

   ```js
   // antes:  .replace(/[<marcas invisibles>]/g, "")
   // después:
   .replace(/[\u0300-\u036f]/g, "")
   ```

4. **`exportarDatos()` escribe `version: "gym.datos.v1"` y nadie la lee** al importar.
5. **`borrarEjercicio()` deja referencias colgando** en `rutinas[].items[].exerciseId`.
   Está manejado (se muestra "(ejercicio eliminado)"), pero convendría decidir:
   ¿avisar de que está en uso, o dejarlo como está? Yo avisaría.

---

## Orden recomendado

1. **A1 + A2 + punto 3 de bugs latentes** — una sesión corta. Quita las tres trampas.
2. **B1 + B5** — el lag al escribir y el doble parseo del arranque. Se nota.
3. **D1 + D2** — contraste y tamaño de botones. Media hora, y es la app que usas sudando.
4. **E1 + E3** — `@ts-check` y el smoke test. A partir de aquí el resto es más seguro.
5. **C2** — partir `datos.js`. Con `@ts-check` puesto, es un refactor tranquilo.
6. **C1** — ES modules. Es el paso grande; hacerlo después de C2, no antes.
7. El resto (A3, A4, B2, B3, B4, C3, C4, D3, D4, D5, E2) según apetezca.

Los pasos 1-4 son **una tarde larga** y se llevan casi todo el valor.
