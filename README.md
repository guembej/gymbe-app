# Gymbe App

PWA personal para registrar y seguir el progreso en el gimnasio.
HTML + CSS + JavaScript, **sin frameworks ni build**, **sin nube**, **funciona sin conexión**.

## Qué hace

- **Rutinas** y **ejercicios** creados a mano (con división: Push, Pull, Pierna…).
- **Entrenar**: registrar cada serie (peso y repes reales), con el objetivo prellenado.
- **Historial** de entrenamientos.
- **Tiempo**: cronómetro y temporizador de series (prepárate → serie / descanso × N).
- **Progreso**: gráfica de evolución por ejercicio (peso máx, volumen, 1RM estimado).
- **Ajustes**: tema claro/oscuro, exportar / importar copia (`.json`).

## Probar en local

```bash
npm start          # servidor en http://localhost:5173
```

Pruebas automáticas (46 casos de la lógica de datos):

```bash
npx playwright install chromium   # solo la primera vez
npm test
```

También puedes abrir `http://localhost:5173/tests/tests.html` en el navegador.

## Estructura

```
index.html            Punto de entrada
css/styles.css         Estilos (paleta con variables; tema claro/oscuro)
js/
  datos.js             Lógica de datos + almacenamiento (localStorage)
  ejemplos.js          Datos de ejemplo (primera apertura)
  dialogos.js          Diálogos propios (confirmar / avisar)
  ejercicios.js rutinas.js entrenar.js historial.js progreso.js tiempo.js ajustes.js
  app.js               Navegación + service worker + varios
manifest.webmanifest   Metadatos de la PWA
sw.js                  Service worker (offline)
server.js              Servidor estático para desarrollo (sin dependencias)
tests/                 Runner casero + casos + run-ci.mjs (Playwright)
ROADMAP.md             Plan por fases
DESPLIEGUE.md          Cómo publicarla (GitHub Pages)
```

## Flujo de trabajo

- **`main` siempre funciona**: es lo que está desplegado.
- Cada fase o cambio grande va en su **rama**:
  ```bash
  git switch -c fase-9-rutinas-reales
  # ... commits ...
  git push -u origin fase-9-rutinas-reales
  ```
  y luego un **Pull Request** en GitHub (las pruebas se corren solas antes de mezclar).
- Arreglos pequeños: commit directo a `main`.
- **Tags** en los hitos: `git tag v0.9 && git push --tags`.

## Desplegar

Ver [DESPLIEGUE.md](DESPLIEGUE.md).
