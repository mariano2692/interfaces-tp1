"use strict";

/* =========================================================
   Datos de juegos — API de la cátedra
   https://github.com/jimartinezabadias/api-vj-interfaces
   ========================================================= */

const URL_API = "https://vj.interfaces.jima.com.ar/api/v2";
const TIMEOUT_API = 4000;

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

// Segundo juego propio (TPE3): rompecabezas de imágenes con filtros
const BLOCKA = {
  id: "blocka",
  name: "Blocka: Pixel Puzzle",
  released: "2026-10-14",
  background_image: "img/blocka.svg",
  background_image_low_res: "img/blocka.svg",
  rating: 4.7,
  genres: [{ name: "Puzzle" }],
  url: "blocka.html",
};

// La API no trae precios. Son gratis los que en la realidad son free-to-play;
// al resto se le asigna un precio fijo a partir del id (siempre el mismo).
const PRECIOS = [9.99, 14.99, 19.99, 29.99, 39.99, 59.99];
const FREE_TO_PLAY = /Counter-Strike|Dota 2|Team Fortress 2|Warframe|Apex Legends|Path of Exile|Destiny 2|Half-Life 2: (Deathmatch|Lost Coast)/;

// Precio inventado de un juego: gratis si es free-to-play; si no, uno de PRECIOS según el id
// (y 1 de cada 5 en oferta con 30 % de descuento)
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

// Pasa un juego del formato de la API (en inglés) al formato que usa el sitio
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

// Pide la lista de juegos a la API; si tarda más de TIMEOUT_API se corta (AbortController)
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
async function obtenerJuegos() {
  let crudos;
  try {
    crudos = await pedirApi();
  } catch (error) {
    console.warn("[NeoArcade] API no disponible, uso copia local:", error.message);
    crudos = window.JUEGOS_RESPALDO || [];
  }
  return [PEG_SOLITAIRE, BLOCKA, ...crudos].map(normalizar);
}

// 45 → "U$D 45"; 19.99 → "U$D 19,99"
function formatearPrecio(valor) {
  // Como en el Figma ("U$D 45"): decimales solo si el precio los tiene
  const decimales = Number.isInteger(valor) ? 0 : 2;
  return `U$D ${valor.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;
}
