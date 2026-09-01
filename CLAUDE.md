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

## Modelo de datos (borrador, evoluciona con las fases)
- `exercises`: [{ id, nombre, notas }]
- `routines`: [{ id, nombre, items: [{ exerciseId, series, repsMin, repsMax, peso, descansoSeg, nota }] }]
- `sessions`: [{ id, routineId, fecha, sets: [{ exerciseId, serie, pesoReal, repsReal }] }]

## Cómo probar
Abrir `index.html` en el navegador (doble clic) o servir la carpeta con `npx serve`.

## Convenciones
- Comentarios en español, breves.
- Nombres de variables en español o inglés simple, coherentes con el archivo.
- Un commit por cada paso con sentido; mensajes en español.
