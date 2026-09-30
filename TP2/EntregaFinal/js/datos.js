// [ESTUDIO] QUÉ ES ESTE ARCHIVO: de dónde salen los juegos. Pide los juegos a la API de la cátedra
// (el "plus" del enunciado), los pasa a un formato propio y les calcula el precio.
// Lo cargan Home y Juego, antes que comun.js.
"use strict";

/* =========================================================
   Datos de juegos — API de la cátedra
   https://github.com/jimartinezabadias/api-vj-interfaces
   ========================================================= */

// [ESTUDIO] Dirección de la API y cuánto se espera como máximo (4000 ms = 4 s) antes de rendirse.
const URL_API = "https://vj.interfaces.jima.com.ar/api/v2";
const TIMEOUT_API = 4000;

// [ESTUDIO] Objeto para traducir los géneros que vienen en inglés: GENEROS_ES["Action"] → "Acción".
const GENEROS_ES = {
  Action: "Acción",
  Shooter: "Shooter",
  RPG: "RPG",
  Adventure: "Aventura",
  Indie: "Indie",
  Puzzle: "Puzzle",
  Platformer: "Plataformas",
  Strategy: "Estrategia",
  Simulation: "Simulación",
  Sports: "Deportes",
  Racing: "Carreras",
  Fighting: "Pelea",
  Arcade: "Arcade",
  Casual: "Casual",
  "Massively Multiplayer": "Multijugador masivo",
};

// Juego propio (no está en la API): es el que abre la página de ejecución
// [ESTUDIO] Peg Solitaire no está en la API: se agrega a mano con el mismo formato que los juegos de la API.
// url: "juego.html" → es el único juego que abre la página de ejecución.
const PEG_SOLITAIRE = {
  id: "peg-solitaire",
  name: "Peg Solitaire: Invasión Pixel",
  released: "2026-09-01",
  background_image: "img/peg-solitaire.svg",
  background_image_low_res: "img/peg-solitaire.svg",
  rating: 4.8,
  genres: [{ name: "Puzzle" }],
  url: "juego.html",
};

// La API no trae precios. Son gratis los que en la realidad son free-to-play;
// al resto se le asigna un precio fijo a partir del id (siempre el mismo).
const PRECIOS = [9.99, 14.99, 19.99, 29.99, 39.99, 59.99];
const FREE_TO_PLAY = /Counter-Strike|Dota 2|Team Fortress 2|Warframe|Apex Legends|Path of Exile|Destiny 2|Half-Life 2: (Deathmatch|Lost Coast)/;

// [ESTUDIO] PRECIOS SIMULADOS (la API no trae precios).
// - FREE_TO_PLAY.test(nombre): expresión regular que dice si el nombre es de un juego gratis.
// - id % PRECIOS.length: el resto de la división elige siempre el mismo precio para el mismo juego.
// - id % 5 === 0 → 1 de cada 5 juegos está en oferta con 30 % de descuento (lista * 0.7).
// Devuelve un objeto: { gratis, lista, final, descuento }.
function calcularPrecio(juego) {
  if (typeof juego.id !== "number" || FREE_TO_PLAY.test(juego.name)) {
    return { gratis: true, final: 0 };
  }
  const lista = PRECIOS[juego.id % PRECIOS.length];
  const enOferta = juego.id % 5 === 0;
  return {
    gratis: false,
    lista,
    final: enOferta ? Math.round(lista * 0.7 * 100) / 100 : lista,
    descuento: enOferta ? 30 : 0,
  };
}

// La API trae la imagen "grande" en 4K (~3,5 MB). RAWG sirve la misma imagen a 1280 px (~115 KB):
// alcanza para el slider y el banner, y en mobile carga mucho más rápido.
const achicarImagen = (url) => url?.replace("media.rawg.io/media/games/", "media.rawg.io/media/resize/1280/-/games/");

// [ESTUDIO] NORMALIZAR: pasa cada juego del formato de la API (en inglés) a uno propio en español
// (nombre, imagen, año, géneros, precio...). Así el resto del código no depende de la API.
// ?.  (optional chaining) = si el valor no existe, no da error. || = si falta, usa lo de la derecha.
function normalizar(juego) {
  return {
    id: juego.id,
    nombre: juego.name,
    imagen: juego.background_image_low_res || juego.background_image,
    imagenGrande: achicarImagen(juego.background_image),
    anio: Number((juego.released || "").slice(0, 4)),
    rating: juego.rating,
    generos: juego.genres.map((g) => GENEROS_ES[g.name] || g.name),
    plataformas: (juego.platforms || [{ name: "Web" }]).map((p) => p.name),
    precio: calcularPrecio(juego),
    url: juego.url || null,
  };
}

// [ESTUDIO] PEDIR LA API (asincrónico: la respuesta tarda, el resto de la página no se congela).
// - async / await: "esperá la respuesta antes de seguir", sin bloquear la página.
// - fetch(URL) hace el pedido. respuesta.json() convierte la respuesta en un array de juegos.
// - AbortController + setTimeout: si en 4 s no respondió, cancela el pedido.
// - finally: se ejecuta siempre (salga bien o mal) y cancela el temporizador.
async function pedirApi() {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIMEOUT_API);
  try {
    const respuesta = await fetch(URL_API, { signal: control.signal });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return await respuesta.json();
  } finally {
    clearTimeout(corte);
  }
}

// Si la API no responde (sin internet, servidor caído) se usa la copia local
// [ESTUDIO] LA FUNCIÓN QUE USAN LAS PÁGINAS: const juegos = await obtenerJuegos();
// try/catch: si la API falla (sin internet, servidor caído), usa la copia local
// (data/juegos-respaldo.js), así el sitio siempre muestra juegos.
// [PEG_SOLITAIRE, ...crudos] pone Peg Solitaire primero y después todos los de la API;
// .map(normalizar) los pasa a todos al formato propio.
async function obtenerJuegos() {
  let crudos;
  try {
    crudos = await pedirApi();
  } catch (error) {
    console.warn("[NeoArcade] API no disponible, uso copia local:", error.message);
    crudos = window.JUEGOS_RESPALDO || [];
  }
  return [PEG_SOLITAIRE, ...crudos].map(normalizar);
}

// [ESTUDIO] Da formato al precio como en el Figma: "U$D 45" o "U$D 29,99" (formato argentino con toLocaleString).
function formatearPrecio(valor) {
  // Como en el Figma ("U$D 45"): decimales solo si el precio los tiene
  const decimales = Number.isInteger(valor) ? 0 : 2;
  return `U$D ${valor.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;
}
