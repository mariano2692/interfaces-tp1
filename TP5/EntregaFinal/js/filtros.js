"use strict";

/* =========================================================
   Filtros de imagen pixel a pixel (Tema 3: Color, píxeles y filtros en canvas)

   Todos reciben un ImageData y lo modifican EN EL LUGAR:
   - imageData.data es un arreglo plano RGBA: 4 lugares por píxel, fila por fila.
   - El píxel (x, y) arranca en el índice (x + y * width) * 4.
   - data es un Uint8ClampedArray: si un valor se pasa de 255 queda en 255
     (y si baja de 0 queda en 0), así que no hace falta acotarlo a mano.
   Modificar data NO cambia el canvas: después hay que llamar a putImageData.
   ========================================================= */

// Recorre la imagen con doble for (como en las filminas) y le pasa a "cambiar"
// los tres canales del píxel; lo que devuelve se guarda en el mismo lugar.
// El alfa (i + 3) no se toca: la imagen sigue igual de opaca.
function recorrerPixeles(imageData, cambiar) {
  const { width, height, data } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * 4;
      const [r, g, b] = cambiar(data[i], data[i + 1], data[i + 2]);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
}

// Escala de grises con los pesos BT.601: el ojo es más sensible al verde,
// por eso pesa más que el rojo y mucho más que el azul (un promedio simple
// le daría el mismo gris a un rojo, un verde y un azul igual de "sumados").
function filtroGrises(imageData) {
  recorrerPixeles(imageData, (r, g, b) => {
    const gris = 0.299 * r + 0.587 * g + 0.114 * b;
    return [gris, gris, gris];
  });
}

// Brillo +30 %: cada canal se multiplica por 1,3.
// Un 220 da 286 → el Uint8ClampedArray lo guarda como 255 (por eso se "quema" lo claro).
function filtroBrillo(imageData) {
  recorrerPixeles(imageData, (r, g, b) => [r * 1.3, g * 1.3, b * 1.3]);
}

// Negativo: cada canal pasa a su opuesto (0 ↔ 255, 100 ↔ 155).
function filtroNegativo(imageData) {
  recorrerPixeles(imageData, (r, g, b) => [255 - r, 255 - g, 255 - b]);
}

// Catálogo para elegir el filtro por nombre desde los niveles del juego
const FILTROS = {
  grises: { nombre: "Escala de grises", aplicar: filtroGrises },
  brillo: { nombre: "Brillo +30 %", aplicar: filtroBrillo },
  negativo: { nombre: "Negativo", aplicar: filtroNegativo },
};
