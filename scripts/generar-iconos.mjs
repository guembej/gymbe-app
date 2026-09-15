// ==========================================================
//  Genera los PNG del icono a partir de los SVG de assets/.
//  NO es un paso de compilación: la app no lo necesita para funcionar. Se
//  ejecuta a mano cuando cambia el logo:  node scripts/generar-iconos.mjs
//  Usa el Playwright que ya está para las pruebas, así no añade dependencias.
// ==========================================================

import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const SALIDAS = [
  { svg: "assets/icono-app.svg", png: "assets/icono-512.v2.png", lado: 512 },
  { svg: "assets/icono-app.svg", png: "assets/icono-192.v2.png", lado: 192 },
  { svg: "assets/icono-maskable.svg", png: "assets/icono-maskable-512.v2.png", lado: 512 },
  { svg: "assets/icono-app.svg", png: "assets/favicon-32.v2.png", lado: 32 },
];

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

for (const { svg, png, lado } of SALIDAS) {
  const contenido = readFileSync(svg, "utf8");
  await pagina.setViewportSize({ width: lado, height: lado });
  await pagina.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${lado}px;height:${lado}px}</style>${contenido}`
  );
  writeFileSync(png, await pagina.screenshot({ omitBackground: true }));
  console.log(`${png}  ${lado}x${lado}`);
}

await navegador.close();
