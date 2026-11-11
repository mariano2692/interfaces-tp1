"use strict";

/* =========================================================
   Nave Pixel — utilidades y medidas del escenario

   El escenario mide siempre 960 × 540 "píxeles de juego": todas las
   posiciones y velocidades están en esa escala. Si la pantalla es más
   chica, el CSS achica todo el escenario junto (Juego.ajustarEscala).
   ========================================================= */

const ANCHO = 960;
const ALTO = 540;
const ALTO_SUELO = 64;
const PISO = ALTO - ALTO_SUELO; // y donde empieza el suelo (476)

// Número al azar entre min y max (con decimales)
function azar(min, max) {
  return min + Math.random() * (max - min);
}

// ¿Se tocan dos cajas? Cada caja es { x, y, w, h } (esquina de arriba a la izquierda + ancho y alto).
// Se tocan si se pisan en el eje x Y en el eje y a la vez.
function choca(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Carga una imagen y devuelve una Promise que se cumple cuando terminó de bajar.
// Sirve para precargar los spritesheets antes de jugar (que no aparezcan a medias).
function cargarImagen(src) {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

// Crea un div con la clase indicada y lo agrega adentro de "padre"
function crearDiv(clase, padre) {
  const div = document.createElement("div");
  div.className = clase;
  padre.appendChild(div);
  return div;
}

// Si la URL termina en ?hitbox, se dibujan las cajas de choque (para probarlas mientras se desarrolla)
const VER_HITBOX = new URLSearchParams(location.search).has("hitbox");

// Dibuja (solo con ?hitbox) un borde con la caja de choque adentro de un elemento.
// "caja" es relativa al elemento: { x, y, w, h } desde su esquina de arriba a la izquierda.
function marcarHitbox(el, caja) {
  if (!VER_HITBOX) return;
  const borde = crearDiv("hitbox", el);
  borde.style.cssText = `left:${caja.x}px; top:${caja.y}px; width:${caja.w}px; height:${caja.h}px`;
}
