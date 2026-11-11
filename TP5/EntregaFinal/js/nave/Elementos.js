"use strict";

/* =========================================================
   Nave Pixel — elementos animados con spritesheet

   Dos elementos DIFERENTES, y ninguno termina el juego (enunciado, punto 4):
     - cristal de energía: aparece en el hueco de algunas columnas y suma
       PUNTOS_CRISTAL puntos;
     - meteorito: llega desde la derecha más rápido que el escenario y, si
       te pega, frena la nave unos segundos (no saca vidas ni puntos).
   Como hacen cosas distintas, cumplen el punto 6 (no pueden hacer lo mismo).

   Igual que la nave: un div de afuera que se mueve con transform y uno
   de adentro con el spritesheet (animación CSS con steps()).
   ========================================================= */

const PUNTOS_CRISTAL = 5;
const PROBABILIDAD_CRISTAL = 0.5; // la mitad de las columnas trae un cristal en el hueco

// Medidas de cada tipo, su caja de choque (relativa al div) y cuánto más rápido que el escenario va
const TIPOS_ELEMENTO = {
  cristal: { w: 36, h: 42, caja: { x: 6, y: 6, w: 24, h: 30 }, extra: 0 },
  meteorito: { w: 66, h: 42, caja: { x: 4, y: 7, w: 32, h: 28 }, extra: 150 },
};

// Qué hace cada elemento al tocarlo (una función por tipo: agregar uno nuevo es agregar una línea)
const EFECTOS = {
  cristal: (juego) => juego.agarrarCristal(),
  meteorito: (juego) => juego.frenar(),
};

class Elementos {
  // "escenario" es el div donde se agregan los divs de los elementos
  constructor(escenario) {
    this.escenario = escenario;
    this.lista = [];
    this.proximoMeteorito = 0;
  }

  // Borra todos los elementos (del DOM y del arreglo) para una partida nueva
  reiniciar() {
    for (const elemento of this.lista) elemento.el.remove();
    this.lista = [];
    this.proximoMeteorito = azar(3, 6);
  }

  // Crea un elemento de ese tipo con su centro en (x, y)
  crear(tipo, x, y) {
    const datos = TIPOS_ELEMENTO[tipo];
    const el = crearDiv(`elemento elemento--${tipo}`, this.escenario);
    crearDiv("elemento__sprite", el);
    marcarHitbox(el, datos.caja);
    this.lista.push({ tipo, ...datos, x: x - datos.w / 2, y: y - datos.h / 2, el, tomado: false });
  }

  // Mueve los elementos hacia la izquierda, larga meteoritos cada tanto y borra los que salieron
  actualizar(dt, velocidad) {
    this.proximoMeteorito -= dt;
    if (this.proximoMeteorito <= 0) {
      this.crear("meteorito", ANCHO + 40, azar(50, PISO - 50));
      this.proximoMeteorito = azar(2.5, 5.5);
    }

    for (const elemento of this.lista) elemento.x -= (velocidad + elemento.extra) * dt;

    // Lo que sale, se borra (del DOM y del arreglo). Acá se usa filter y no shift porque
    // los meteoritos van más rápido: el primero del arreglo no es siempre el de más a la izquierda.
    this.lista = this.lista.filter((elemento) => {
      const salio = elemento.x < -elemento.w;
      if (salio) elemento.el.remove();
      return !salio;
    });
  }

  // La caja de choque de un elemento en coordenadas del escenario
  caja(elemento) {
    return { x: elemento.x + elemento.caja.x, y: elemento.y + elemento.caja.y, w: elemento.caja.w, h: elemento.caja.h };
  }

  // Revisa si la nave (su caja) toca algún elemento. Cada elemento se toma una sola vez:
  // se aplica su efecto y se le pone la clase que dispara la animación de "tomado".
  revisarChoques(cajaNave, juego) {
    for (const elemento of this.lista) {
      if (!elemento.tomado && choca(cajaNave, this.caja(elemento))) {
        elemento.tomado = true;
        EFECTOS[elemento.tipo](juego);
        elemento.el.classList.add("elemento--tomado");
      }
    }
  }

  // Muestra la posición de cada elemento con transform
  dibujar() {
    for (const elemento of this.lista) {
      elemento.el.style.transform = `translate(${elemento.x}px, ${elemento.y}px)`;
    }
  }
}
