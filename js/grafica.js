// @ts-check
// ==========================================================
//  Matematica de los ejes de la grafica
//  Solo calculo: donde poner las marcas de los ejes X e Y.
// ==========================================================

// El paso "bonito" inmediatamente menor que 'paso' (de la serie 1,2,5,10,20,50...)
function _pasoBonitoMenor(paso) {
  const magnitud = Math.pow(10, Math.floor(Math.log10(paso) - 1e-9));
  const n = paso / magnitud; // ~1, 2, 5 o 10
  if (n > 5) return 5 * magnitud;
  if (n > 2) return 2 * magnitud;
  if (n > 1) return 1 * magnitud;
  return magnitud / 2; // de 1 bajaría a 0.5 (luego se limita a 1)
}

// Marcas del eje Y de una gráfica: al menos 5, todas enteras, paso de 1/2/5 x 10^k,
// cubriendo [datoMin, datoMax]. Devuelve { min, max, marcas: [...] }.
function marcasEjeY(datoMin, datoMax) {
  if (datoMin === datoMax) { datoMin -= 1; datoMax += 1; }
  const OBJETIVO = 5;

  const pasoCrudo = (datoMax - datoMin) / (OBJETIVO - 1);
  const magnitud = Math.pow(10, Math.floor(Math.log10(pasoCrudo)));
  const norm = pasoCrudo / magnitud;
  let paso = magnitud * (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10);
  paso = Math.max(1, paso);

  let min = Math.floor(datoMin / paso) * paso;
  let max = Math.ceil(datoMax / paso) * paso;

  let vueltas = 0;
  while (Math.round((max - min) / paso) + 1 < OBJETIVO && vueltas++ < 20) {
    const menor = Math.max(1, _pasoBonitoMenor(paso));
    if (menor < paso) {
      paso = menor;
    } else {
      max += paso;
      if (Math.round((max - min) / paso) + 1 < OBJETIVO) min -= paso;
    }
    min = Math.floor(min / paso) * paso;
    max = Math.ceil(max / paso) * paso;
  }

  const marcas = [];
  for (let v = min; v <= max + 1e-9; v += paso) marcas.push(Math.round(v));
  return { min, max, marcas };
}

// Índices a etiquetar en un eje X de 'n' puntos: todos si son pocos; si no,
// unos cuantos repartidos de forma pareja, siempre con el primero y el último.
function indicesEtiquetasX(n, maximo) {
  if (n <= maximo) return [...Array(n).keys()];
  const idx = new Set([0, n - 1]);
  const paso = (n - 1) / (maximo - 1);
  for (let j = 1; j < maximo - 1; j++) idx.add(Math.round(j * paso));
  return [...idx].sort((a, b) => a - b);
}
