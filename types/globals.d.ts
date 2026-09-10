// Declaraciones para la comprobación de tipos (npm run tipos). NO se carga en la
// app: solo completa lo que TypeScript no puede deducir del código.
//
// El resto de nombres globales (avisar, confirmar, CLAVE_TIEMPO...) NO hace falta
// declararlos: los archivos se cargan como <script> normales y comparten ámbito,
// así que TypeScript ya los ve desde los propios .js.

interface Window {
  /** La página de pruebas define otra clave para no tocar los datos reales. */
  GYM_CLAVE_ALMACEN?: string;
}
