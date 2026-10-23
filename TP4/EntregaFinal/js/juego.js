"use strict";

/* =========================================================
   Página de juego — Peg Solitaire: Invasión Pixel (TPE4)

   El juego está en js/peg/, separado en Modelo, Vista y Controlador:
   - Ficha.js y Tablero.js (Modelo): datos y reglas, no dibujan nada
   - Vista.js: dibuja en el canvas lo que le pasan
   - Controlador.js: eventos del mouse, reloj y loop de dibujo
   Este archivo carga las imágenes, arma esas 3 piezas y además maneja
   el resto de la página (mini tableros de la ayuda, comunidad).
   ========================================================= */

/* ---------- Juego ---------- */

// Imágenes del juego: el tablero vacío de fondo y un invasor por cada tipo de ficha
const IMAGENES_PEG = {
  fondo: "img/peg/tablero.svg",
  cangrejo: "img/peg/invasor-cangrejo.svg",
  calamar: "img/peg/invasor-calamar.svg",
  pulpo: "img/peg/invasor-pulpo.svg",
  ovni: "img/peg/invasor-ovni.svg",
};

// Cargar una imagen es ASINCRÓNICO (igual que en Blocka): se espera a onload con una Promise
function cargarImagen(src) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error(`No se pudo cargar ${src}`));
    imagen.src = src;
  });
}

// Carga todas las imágenes a la vez (Promise.all espera a que terminen todas)
// y devuelve un objeto con la misma forma que IMAGENES_PEG pero con las imágenes adentro
async function cargarImagenesPeg() {
  const nombres = Object.keys(IMAGENES_PEG);
  const imagenes = await Promise.all(nombres.map((nombre) => cargarImagen(IMAGENES_PEG[nombre])));
  const resultado = {};
  nombres.forEach((nombre, i) => (resultado[nombre] = imagenes[i]));
  return resultado;
}

// Arma el juego: Vista (dibuja) + Controlador (eventos y loop). El Tablero lo crea
// el Controlador cuando se aprieta Jugar; hasta entonces se ve el tablero vacío.
async function iniciarJuego() {
  const canvas = document.getElementById("lienzo");
  const imagenes = await cargarImagenesPeg();
  const vista = new Vista(canvas, imagenes);
  const controlador = new Controlador(vista, canvas, document.getElementById("jugar"));
  controlador.iniciar();
}

/* ---------- Mini tableros de las instrucciones ---------- */

// Dibuja los 3 mini tableros de la ayuda (objetivo, antes y después de un salto) con spans y CSS.
// conTipo arma una matriz con la forma de la cruz (Tablero.esCasilla): el tipo dado adentro y null afuera.
function dibujarMinis() {
  const conTipo = (tipo) =>
    Array.from({ length: TAMANIO }, (_, f) => Array.from({ length: TAMANIO }, (_, c) => (Tablero.esCasilla(f, c) ? tipo : null)));
  const objetivo = conTipo("hueco");
  objetivo[CENTRO][CENTRO] = "resalte";

  // Antes: la ficha resaltada salta por encima de su vecina hacia el centro vacío
  const antes = conTipo("ficha");
  antes[CENTRO][CENTRO] = "hueco";
  antes[CENTRO][1] = "resalte";

  // Después: ocupó el centro y la ficha saltada desapareció
  const despues = conTipo("ficha");
  despues[CENTRO][1] = "hueco";
  despues[CENTRO][2] = "hueco";
  despues[CENTRO][CENTRO] = "resalte";

  const estados = { objetivo, antes, despues };
  document.querySelectorAll(".mini").forEach((mini) => {
    mini.innerHTML = estados[mini.dataset.mini]
      .flat()
      .map((tipo) => (tipo ? `<span class="mini__${tipo}"></span>` : "<span></span>"))
      .join("");
  });
}

/* ---------- Comunidad ---------- */

const COMENTARIOS = [
  { nick: "PixelWarrior", fecha: "hace dos días", texto: "Adictivo. Me pasé una hora intentando dejar una sola ficha y no pude, pero volví al toque." },
  { nick: "kabeza", fecha: "hace una semana", texto: "Buenísimo para despejar la cabeza. Las animaciones de los invaders son un golazo." },
  { nick: "el_nano", fecha: "hace dos semanas", texto: "El mejor Peg Solitaire que probé. La estética arcade le da mucha identidad." },
];

/* ---------- Inicio ---------- */

// Arranca todo lo de la página
async function iniciarPaginaJuego() {
  iniciarComun();
  iniciarJuego();
  dibujarMinis();
  iniciarCompartir("Jugá Peg Solitaire: Invasión Pixel en NeoArcade");
  iniciarComunidad(COMENTARIOS);

  conectarBotonesDeCards(await obtenerJuegos());
}

iniciarPaginaJuego();
