"use strict";

/* =========================================================
   Página de Nave Pixel (TPE5): precarga las imágenes, arranca el juego
   y conecta las partes comunes de la página (compartir y comunidad)
   ========================================================= */

// Todas las imágenes del juego: se cargan antes de habilitar "Jugar"
// para que ningún spritesheet aparezca a medias en la primera partida
const IMAGENES_NAVE = [
  "nave", "explosion", "cristal", "meteorito", "roca",
  "capa-estrellas", "capa-nebulosa", "capa-montanas", "capa-suelo",
].map((nombre) => `img/nave/${nombre}.svg`);

// Reseñas de ejemplo de la Comunidad
const COMENTARIOS = [
  { nick: "AstroGamer", fecha: "hace 2 horas", texto: "El meteorito que te frena es un detalle genial: hay que aprender a esquivarlo y no solo a pasar las columnas." },
  { nick: "PixelPilot", fecha: "hace 1 día", texto: "Llegué a la base con una sola vida. Los últimos huecos son muy angostos, ¡qué nervios!" },
  { nick: "LunaRetro", fecha: "hace 3 días", texto: "Me encanta cómo se mueven las capas del fondo, se siente la profundidad del espacio." },
];

// Precarga las imágenes con Promise.all (espera a todas) y recién ahí habilita el juego
async function iniciarNave() {
  const juego = new Juego();
  try {
    await Promise.all(IMAGENES_NAVE.map(cargarImagen));
    juego.listo();
  } catch (error) {
    console.error("[Nave Pixel]", error.message);
    mostrarToast("No se pudieron cargar las imágenes del juego");
  }
}

// Arranca todo lo de la página de Nave Pixel (igual que Blocka: header/footer, juego, compartir, comunidad)
function iniciarPaginaNave() {
  iniciarComun();
  iniciarNave();
  iniciarCompartir("Jugá Nave Pixel: Cinturón de Asteroides en NeoArcade");
  iniciarComunidad(COMENTARIOS);
}

iniciarPaginaNave();
