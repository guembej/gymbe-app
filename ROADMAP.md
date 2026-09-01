# GYM APP — Plan de desarrollo

App personal para registrar y seguir mi progreso en el gimnasio.

## Qué queremos (resumen)

- Rutinas guardadas: unas que definimos nosotros + otras que creo y personalizo yo.
- **Sin plantillas de ejercicios**: los ejercicios los escribo yo a mano.
- Al añadir un ejercicio a una rutina puedo definir: nº de series, tipo/tiempo de descanso,
  nº de repeticiones o rango de repeticiones, peso, y una nota de texto libre.
- Registrar cada entrenamiento y ver la **evolución** (peso y repeticiones a lo largo del tiempo).
- **Cronómetro** (cuenta hacia arriba) para medir cuánto dura un ejercicio.
- **Temporizador** (cuenta atrás) para los descansos, con aviso.
- Visualmente sencilla. Funciona en Android; se prueba también en el PC.
- **Offline** y **sin nube**. Los datos viven en el propio dispositivo.
- **Exportar / importar** toda la base de datos con un archivo, de forma fácil.

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
- Menú inferior con: Rutinas · Entrenar · Progreso · Cronómetro · Ajustes.
- Cada sección es una pantalla vacía por ahora.
- Estilos base (colores, tipografía, que se vea bien en móvil).
- **Aprendes:** cómo está organizado un archivo HTML/CSS/JS y cómo se "sirve" una web en local.

### Fase 2 — Ejercicios y rutinas
**Objetivo:** poder crear mi biblioteca de ejercicios y mis rutinas.
- Pantalla para crear / editar / borrar **ejercicios** (solo nombre y, opcional, notas o grupo muscular).
- Pantalla para crear **rutinas** y añadirles ejercicios.
- Por cada ejercicio dentro de una rutina: series, repeticiones o rango, peso objetivo, descanso, nota.
- Todo se guarda en el dispositivo (sigue ahí al cerrar y abrir).
- **Aprendes:** cómo se representan y guardan los datos (listas y fichas de información).

### Fase 3 — Registrar un entrenamiento
**Objetivo:** usar la app durante el entreno.
- Elegir una rutina y pulsar "Empezar".
- Ir marcando series hechas y anotar el peso y las repes reales de cada serie.
- Al terminar, se guarda la sesión con su fecha.
- Ver el historial de sesiones.
- **Aprendes:** el "estado" de la app y el manejo de formularios.

### Fase 4 — Cronómetro y temporizador
**Objetivo:** las dos herramientas de tiempo.
- Cronómetro que cuenta hacia arriba (para medir un ejercicio).
- Temporizador de descanso que cuenta atrás, con sonido y/o vibración al llegar a 0.
- Poder lanzarlo rápido desde la pantalla de entrenamiento.
- **Aprendes:** cómo se maneja el tiempo en JavaScript.

### Fase 5 — Progreso y gráficas
**Objetivo:** ver la evolución.
- Elegir un ejercicio y ver su progreso: peso máximo, volumen total, repeticiones, por fecha.
- Una gráfica sencilla.
- **Aprendes:** agrupar y resumir datos; usar una librería de gráficas.

### Fase 6 — Exportar / importar
**Objetivo:** copias de seguridad y mover datos entre dispositivos.
- Botón **Exportar**: descarga un `.json` con absolutamente todo.
- Botón **Importar**: cargar ese archivo (con aviso antes de sobrescribir).
- **Aprendes:** leer y escribir archivos desde el navegador.

### Fase 7 — Hacerla instalable (PWA) y pulir
**Objetivo:** que se instale en Android y funcione 100% offline.
- Icono, nombre, color de tema.
- "Service worker" para que cargue sin internet.
- Repaso de detalles visuales y de uso.
- **Aprendes:** qué es exactamente una PWA.

### Fase 8 — Rutinas pregrabadas y uso real
**Objetivo:** cargar mis rutinas de verdad y empezar a usarla en serio.
- Metemos como datos iniciales las rutinas que definamos juntos.
- Ajustes según lo que note usándola.

---

## Estado actual

- [x] Fase 0 — Preparación
- [x] Fase 1 — Esqueleto y navegación
- [ ] Fase 2 — Ejercicios y rutinas
- [ ] Fase 3 — Registrar entrenamiento
- [ ] Fase 4 — Cronómetro y temporizador
- [ ] Fase 5 — Progreso y gráficas
- [ ] Fase 6 — Exportar / importar
- [ ] Fase 7 — PWA y pulido
- [ ] Fase 8 — Rutinas pregrabadas y uso real
