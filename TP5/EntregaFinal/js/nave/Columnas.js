"use strict";

/* =========================================================
   Nave Pixel — columnas de asteroides (los obstáculos)

   Cada columna es un objeto { x, centro, hueco, el, pasada } con dos
   divs: la parte de arriba y la de abajo. Entre las dos queda el hueco
   por donde tiene que pasar la nave. Lo que pide el enunciado:
     - la distancia horizontal entre columnas no es siempre la misma
       (DISTANCIA_MIN..DISTANCIA_MAX, al azar);
     - el hueco se achica a medida que avanza la partida (HUECO_INICIAL
       baja ACHIQUE píxeles por segundo, hasta HUECO_MIN);
     - los huecos no están alineados: el centro de cada uno es al azar.
   ========================================================= */

const ANCHO_COLUMNA = 72;
const HUECO_INICIAL = 210;
const HUECO_MIN = 125;
const ACHIQUE = 3; // px por segundo de partida (a los ~28 s llega a HUECO_MIN)
const VARIACION_HUECO = 12; // ± px al azar para que no sean todos iguales
const MARGEN_HUECO = 36; // distancia mínima del hueco al techo y al suelo
const DISTANCIA_MIN = 260; // px entre una columna y la siguiente
const DISTANCIA_MAX = 420;
const DISTANCIA_PRIMERA = 300; // al empezar, cuánto falta para la primera

class Columnas {
  // "escenario" es el div donde se agregan los divs de las columnas
  constructor(escenario) {
    this.escenario = escenario;
    this.lista = [];
    this.distancia = DISTANCIA_PRIMERA;
  }

  // Borra todas las columnas (del DOM y del arreglo) para una partida nueva
  reiniciar() {
    for (const columna of this.lista) columna.el.remove();
    this.lista = [];
    this.distancia = DISTANCIA_PRIMERA;
  }

  // Crea una columna nueva en el borde derecho. "tiempo" = segundos de partida (para achicar el hueco).
  // Devuelve la columna creada.
  crear(tiempo) {
    const hueco = Math.max(HUECO_MIN, HUECO_INICIAL - tiempo * ACHIQUE) + azar(-VARIACION_HUECO, VARIACION_HUECO);
    const centro = azar(MARGEN_HUECO + hueco / 2, PISO - MARGEN_HUECO - hueco / 2);

    const el = crearDiv("columna", this.escenario);
    const arriba = crearDiv("columna__parte columna__parte--arriba", el);
    const abajo = crearDiv("columna__parte columna__parte--abajo", el);
    arriba.style.height = `${centro - hueco / 2}px`;
    abajo.style.top = `${centro + hueco / 2}px`;
    abajo.style.height = `${PISO - (centro + hueco / 2)}px`;
    // Al chocar, la columna tiembla (clase columna--golpeada); al terminar se la saca
    el.addEventListener("animationend", () => el.classList.remove("columna--golpeada"));

    const columna = { x: ANCHO, centro, hueco, el, pasada: false };
    this.lista.push(columna);
    this.distancia = azar(DISTANCIA_MIN, DISTANCIA_MAX);
    return columna;
  }

  // Mueve las columnas hacia la izquierda a la velocidad del juego, crea una nueva cuando
  // corresponde y borra las que ya salieron de la pantalla.
  // Devuelve la columna nueva si se creó una en este cuadro (o null).
  actualizar(dt, velocidad, tiempo) {
    let nueva = null;
    this.distancia -= velocidad * dt;
    if (this.distancia <= 0) nueva = this.crear(tiempo);

    for (const columna of this.lista) columna.x -= velocidad * dt;

    // Lo que sale, se borra: del arreglo (shift) y del DOM (remove). Si no, se seguirían
    // moviendo todas en cada cuadro aunque no se vean, y el juego se pondría lento.
    // La primera del arreglo siempre es la que está más a la izquierda.
    while (this.lista.length && this.lista[0].x < -ANCHO_COLUMNA) {
      this.lista.shift().el.remove();
    }
    return nueva;
  }

  // Caja de la parte de arriba de una columna
  arriba(columna) {
    return { x: columna.x, y: 0, w: ANCHO_COLUMNA, h: columna.centro - columna.hueco / 2 };
  }

  // Caja de la parte de abajo de una columna
  abajo(columna) {
    const y = columna.centro + columna.hueco / 2;
    return { x: columna.x, y, w: ANCHO_COLUMNA, h: PISO - y };
  }

  // La columna con la que choca la caja, o undefined si no choca con ninguna
  chocaCon(caja) {
    return this.lista.find((c) => choca(caja, this.arriba(c)) || choca(caja, this.abajo(c)));
  }

  // Hace temblar una columna (animación CSS). Se saca y se vuelve a poner la clase
  // con un reflow en el medio para que la animación arranque de nuevo.
  sacudir(columna) {
    columna.el.classList.remove("columna--golpeada");
    void columna.el.offsetWidth;
    columna.el.classList.add("columna--golpeada");
  }

  // Cuántas columnas pasó la nave desde el cuadro anterior (cada una cuenta una sola vez)
  contarPasadas(x) {
    let pasadas = 0;
    for (const columna of this.lista) {
      if (!columna.pasada && columna.x + ANCHO_COLUMNA < x) {
        columna.pasada = true;
        pasadas++;
      }
    }
    return pasadas;
  }

  // Muestra la posición de cada columna con transform
  dibujar() {
    for (const columna of this.lista) {
      columna.el.style.transform = `translateX(${columna.x}px)`;
    }
  }
}
