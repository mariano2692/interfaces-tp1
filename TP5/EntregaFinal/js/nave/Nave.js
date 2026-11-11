"use strict";

/* =========================================================
   Nave Pixel — el avatar (la nave que maneja el jugador)

   Estado en JS, vista en el DOM: la posición y la velocidad se guardan
   en el objeto; el div solo las muestra (dibujar). La nave no avanza en
   x: está siempre en NAVE_X y lo que se mueve es el escenario.

   Dos divs: el de afuera (.nave) se mueve con transform desde JS;
   el de adentro (.nave__sprite) tiene el spritesheet y las animaciones
   CSS de cada estado. Si los dos usaran transform, se pisarían.

   Cada estado es una clase CSS (nave--vuela, nave--impulso, ...):
   el JS decide el estado y el CSS decide cómo se ve (@keyframes).
   ========================================================= */

const NAVE_X = 180; // x fija de la nave en el escenario
const ANCHO_NAVE = 72;
const ALTO_NAVE = 44;
const GRAVEDAD = 1500; // px/s² hacia abajo
const IMPULSO = -470; // px/s hacia arriba al hacer clic
const CAIDA_MAXIMA = 620; // px/s: tope de la velocidad de caída
const VIDAS = 10; // el juego no tiene meta: se juega hasta perderlas todas (gana el récord)
const SEGUNDOS_INVULNERABLE = 1.5; // después de un golpe, para no perder 2 vidas en el mismo choque

// Caja de choque: más chica que el dibujo (sin la llama ni las puntas de las alas)
const CAJA_NAVE = { x: 18, y: 12, w: 46, h: 20 };

const ESTADOS_NAVE = ["vuela", "impulso", "golpe", "brillo", "aturdida", "explota"];
// Animaciones que duran un rato y después la nave vuelve a "vuela"
const ANIMACIONES_TEMPORALES = ["nave-impulso", "nave-golpe", "nave-brillo", "nave-aturdida"];

class Nave {
  // Crea los divs de la nave adentro del escenario.
  // alExplotar: función que se llama cuando termina la animación de la explosión
  constructor(escenario, alExplotar) {
    this.el = crearDiv("nave", escenario);
    this.sprite = crearDiv("nave__sprite", this.el);
    marcarHitbox(this.el, CAJA_NAVE);
    this.alExplotar = alExplotar;
    // animationend avisa cuando termina una animación CSS: así el estado vuelve solo a "vuela"
    this.sprite.addEventListener("animationend", (e) => this.alTerminarAnimacion(e));
    this.reiniciar();
  }

  // Deja la nave como al principio de una partida: en el medio, quieta y con todas las vidas
  reiniciar() {
    this.y = PISO / 2 - ALTO_NAVE / 2;
    this.vy = 0;
    this.vidas = VIDAS;
    this.invulnerable = 0;
    this.el.classList.remove("nave--invulnerable");
    this.ponerEstado("vuela");
  }

  // Clic o tecla: la nave sale para arriba. La animación de impulso no tapa a las de golpe,
  // brillo o aturdida (esas son más importantes para que el jugador entienda qué pasó).
  impulsar() {
    if (this.estado === "explota") return;
    this.vy = IMPULSO;
    if (this.estado === "vuela" || this.estado === "impulso") this.ponerEstado("impulso");
  }

  // Física de cada cuadro: la gravedad suma velocidad hacia abajo y la velocidad mueve la nave.
  // dt = segundos desde el cuadro anterior (velocidad en px/s × segundos = píxeles).
  actualizar(dt) {
    if (this.estado === "explota") return;
    this.vy = Math.min(this.vy + GRAVEDAD * dt, CAIDA_MAXIMA);
    this.y += this.vy * dt;
    if (this.y < 0) { // el techo frena, no lastima
      this.y = 0;
      this.vy = 0;
    }
    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      if (this.invulnerable === 0) this.el.classList.remove("nave--invulnerable");
    }
  }

  // La caja de choque en coordenadas del escenario
  hitbox() {
    return { x: NAVE_X + CAJA_NAVE.x, y: this.y + CAJA_NAVE.y, w: CAJA_NAVE.w, h: CAJA_NAVE.h };
  }

  // Choque contra una columna o el suelo: pierde una vida (si no estaba invulnerable).
  // Devuelve true si el golpe contó. Con la última vida, explota.
  chocar() {
    if (this.invulnerable > 0 || this.estado === "explota") return false;
    this.vidas--;
    if (this.vidas === 0) {
      this.vy = 0;
      this.ponerEstado("explota");
    } else {
      this.invulnerable = SEGUNDOS_INVULNERABLE;
      this.el.classList.add("nave--invulnerable"); // parpadea mientras no se le puede pegar
      this.ponerEstado("golpe");
    }
    return true;
  }

  // Al tocar el suelo rebota hacia arriba (así no queda pegada perdiendo vidas)
  rebotar() {
    this.y = PISO - CAJA_NAVE.y - CAJA_NAVE.h;
    this.vy = IMPULSO * 0.8;
  }

  // Agarró un cristal: brilla
  brillar() {
    if (this.estado !== "explota") this.ponerEstado("brillo");
  }

  // La golpeó un meteorito: queda aturdida (tambalea)
  aturdir() {
    if (this.estado !== "explota") this.ponerEstado("aturdida");
  }

  // Cambia la clase de estado. "void offsetWidth" obliga al navegador a aplicar el cambio
  // antes de poner la clase nueva: si no, repetir el mismo estado no reinicia la animación.
  ponerEstado(nombre) {
    this.el.classList.remove(...ESTADOS_NAVE.map((e) => `nave--${e}`));
    void this.el.offsetWidth;
    this.el.classList.add(`nave--${nombre}`);
    this.estado = nombre;
  }

  // Terminó una animación CSS: si era temporal vuelve a volar; si era la explosión, avisa al juego
  alTerminarAnimacion(e) {
    if (e.animationName === "nave-explota") this.alExplotar();
    else if (ANIMACIONES_TEMPORALES.includes(e.animationName)) this.ponerEstado("vuela");
  }

  // Muestra la posición con transform. Se inclina según la velocidad: para arriba al subir
  // y para abajo al caer (como mucho 35°).
  dibujar() {
    const angulo = this.estado === "explota" ? 0 : Math.max(-25, Math.min((this.vy / CAIDA_MAXIMA) * 35, 35));
    this.el.style.transform = `translate(${NAVE_X}px, ${this.y}px) rotate(${angulo}deg)`;
  }
}
