"use strict";

/* =========================================================
   Nave Pixel — fondo con parallax scrolling de 4 capas

   Cada capa es un div con su imagen repetida en horizontal. Para dar
   profundidad, las capas lejanas se mueven más lento que las cercanas:
   cada una avanza a "velocidad del juego × factor". El suelo tiene
   factor 1: se mueve exactamente igual que las columnas, así parece
   que las columnas están clavadas en el suelo.
   ========================================================= */

const CAPAS = [
  { clase: "capa capa--estrellas", ancho: 960, factor: 0.08 }, // lo más lejano: casi quieto
  { clase: "capa capa--nebulosa", ancho: 1440, factor: 0.2 },
  { clase: "capa capa--montanas", ancho: 960, factor: 0.45 },
  { clase: "capa capa--suelo", ancho: 96, factor: 1 }, // misma velocidad que las columnas
];

class Parallax {
  // Crea los 4 divs de las capas adentro del escenario (en ese orden: el último queda adelante)
  constructor(escenario) {
    this.capas = CAPAS.map((datos) => {
      const el = crearDiv(datos.clase, escenario);
      // La capa es más ancha que el escenario (una baldosa de más) para que al correrse
      // nunca se vea el borde; cuando corrió una baldosa entera, vuelve a 0 sin que se note.
      el.style.width = `${ANCHO + datos.ancho}px`;
      return { ...datos, el, desplazamiento: 0 };
    });
  }

  // Mueve cada capa según la velocidad del juego (px/s) y los segundos que pasaron (dt)
  actualizar(dt, velocidad) {
    for (const capa of this.capas) {
      capa.desplazamiento = (capa.desplazamiento + velocidad * capa.factor * dt) % capa.ancho;
    }
  }

  // Muestra la posición de cada capa con transform (nunca con left: transform no recalcula el layout)
  dibujar() {
    for (const capa of this.capas) {
      capa.el.style.transform = `translateX(${-capa.desplazamiento}px)`;
    }
  }
}
