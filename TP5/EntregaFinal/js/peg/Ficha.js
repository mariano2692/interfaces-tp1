"use strict";

/* =========================================================
   Peg Solitaire — Modelo: Ficha

   Una ficha sabe solo sus datos: qué invasor es (tipo) y en qué casillero está.
   No sabe dibujarse (eso es de la Vista) ni si un salto es válido (eso es del Tablero).
   ========================================================= */

// Los 4 tipos de invasor. Para el juego son todos iguales: cambia solo la imagen.
const TIPOS_FICHA = ["cangrejo", "calamar", "pulpo", "ovni"];

class Ficha {
  // Crea una ficha del tipo dado, parada en el casillero (fila, columna)
  constructor(tipo, fila, columna) {
    this.tipo = tipo;
    this.fila = fila;
    this.columna = columna;
  }

  // Cambia el casillero de la ficha (lo llama el Tablero cuando el salto es válido)
  moverA(fila, columna) {
    this.fila = fila;
    this.columna = columna;
  }
}
