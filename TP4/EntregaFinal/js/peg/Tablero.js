"use strict";

/* =========================================================
   Peg Solitaire — Modelo: Tablero

   Guarda dónde está cada ficha y conoce las reglas del juego:
   qué saltos son válidos, cómo se hace un salto y si quedan movimientos.
   No dibuja nada ni escucha al mouse: se puede probar entero desde la consola.

   Casilleros: matriz de 7 × 7. Solo valen los de la cruz (33);
   en cada uno hay una Ficha o null (vacío).
   ========================================================= */

const TAMANIO = 7;
const CENTRO = 3;

// Un salto mueve 2 casilleros en línea recta: arriba, abajo, izquierda o derecha
const DIRECCIONES = [
  { fila: -2, columna: 0 },
  { fila: 2, columna: 0 },
  { fila: 0, columna: -2 },
  { fila: 0, columna: 2 },
];

class Tablero {
  // Arma el tablero inicial: todos los casilleros con ficha menos el del centro
  constructor() {
    this.casillas = [];
    for (let fila = 0; fila < TAMANIO; fila++) {
      this.casillas.push([]);
      for (let columna = 0; columna < TAMANIO; columna++) {
        const conFicha = Tablero.esCasilla(fila, columna) && !(fila === CENTRO && columna === CENTRO);
        this.casillas[fila].push(conFicha ? new Ficha(Tablero.tipoAlAzar(), fila, columna) : null);
      }
    }
  }

  // ¿(fila, columna) es un casillero de la cruz? Las 4 esquinas de 2 × 2 no lo son.
  // Es static porque no depende de las fichas: es la forma del tablero (la usa también la ayuda).
  static esCasilla(fila, columna) {
    const dentro = fila >= 0 && fila < TAMANIO && columna >= 0 && columna < TAMANIO;
    const enLaCruz = (fila >= 2 && fila <= 4) || (columna >= 2 && columna <= 4);
    return dentro && enLaCruz;
  }

  // Un tipo de invasor al azar, para que el tablero no sea siempre igual
  static tipoAlAzar() {
    return TIPOS_FICHA[Math.floor(Math.random() * TIPOS_FICHA.length)];
  }

  // La ficha que hay en (fila, columna), o null si está vacío o fuera del tablero
  fichaEn(fila, columna) {
    if (!Tablero.esCasilla(fila, columna)) return null;
    return this.casillas[fila][columna];
  }

  // ¿(fila, columna) es un casillero de la cruz y no tiene ficha?
  estaVacia(fila, columna) {
    return Tablero.esCasilla(fila, columna) && this.casillas[fila][columna] === null;
  }

  // Todas las fichas que siguen en el tablero, en una lista
  fichas() {
    return this.casillas.flat().filter((ficha) => ficha !== null);
  }

  // Cuántas fichas quedan
  cantidadFichas() {
    return this.fichas().length;
  }

  // Los casilleros a los que puede saltar la ficha. Un salto es válido si
  // el casillero de al lado tiene ficha (la que se come) y el de 2 más allá está vacío.
  // Devuelve [{ fila, columna, saltada }] (saltada = la ficha que se comería).
  obtenerMovimientosPosibles(ficha) {
    const destinos = [];
    for (const direccion of DIRECCIONES) {
      const fila = ficha.fila + direccion.fila;
      const columna = ficha.columna + direccion.columna;
      const saltada = this.fichaEn(ficha.fila + direccion.fila / 2, ficha.columna + direccion.columna / 2);
      if (saltada !== null && this.estaVacia(fila, columna)) {
        destinos.push({ fila, columna, saltada });
      }
    }
    return destinos;
  }

  // Hace el salto si es válido: la ficha pasa al destino y la saltada sale del tablero.
  // Devuelve true si se movió y false si no (en ese caso no cambia nada).
  mover(ficha, fila, columna) {
    const destino = this.obtenerMovimientosPosibles(ficha).find((d) => d.fila === fila && d.columna === columna);
    if (!destino) return false;

    this.casillas[ficha.fila][ficha.columna] = null;
    this.casillas[destino.saltada.fila][destino.saltada.columna] = null;
    this.casillas[fila][columna] = ficha;
    ficha.moverA(fila, columna);
    return true;
  }

  // ¿Alguna ficha tiene al menos un salto? Si ninguna tiene, el juego termina.
  hayMovimientos() {
    return this.fichas().some((ficha) => this.obtenerMovimientosPosibles(ficha).length > 0);
  }
}
