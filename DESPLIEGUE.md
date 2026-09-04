# Publicar Gymbe App en internet (GitHub Pages)

Para poder **instalar la app en el móvil** hace falta que esté en una URL `https`.
GitHub Pages es gratis y sirve la app tal cual (no hace falta compilar nada).

## Una sola vez: crear el repositorio

1. Entra en <https://github.com> con tu cuenta.
2. Botón **New repository**.
   - Nombre: por ejemplo `gymbe-app`.
   - Público o privado, da igual (Pages funciona con los dos en cuentas normales).
   - **No** marques "Add a README".
   - **Create repository**.
3. En la pantalla siguiente, copia la URL que aparece (algo como
   `https://github.com/TU_USUARIO/gymbe-app.git`).

## Subir el código (desde la carpeta del proyecto)

```bash
git remote add origin https://github.com/TU_USUARIO/gymbe-app.git
git push -u origin main
```

(GitHub te pedirá iniciar sesión la primera vez.)

## Activar GitHub Pages

1. En el repositorio: **Settings** → **Pages** (menú de la izquierda).
2. En **Source**, elige **Deploy from a branch**.
3. Branch: **main**, carpeta **/ (root)**. **Save**.
4. Espera 1–2 minutos. Arriba aparecerá la URL:
   `https://TU_USUARIO.github.io/gymbe-app/`

## Instalar en el móvil (Android)

1. Abre esa URL en **Chrome** en el móvil.
2. Menú (⋮) → **Instalar aplicación** / **Añadir a pantalla de inicio**.
3. Ya tienes Gymbe como una app: pantalla completa, icono propio y funciona sin conexión.

## Actualizar la app más adelante

Cada vez que cambiemos algo:

```bash
git push
```

GitHub Pages se actualiza solo en un par de minutos. La app en el móvil coge la versión
nueva la próxima vez que la abras con conexión.
