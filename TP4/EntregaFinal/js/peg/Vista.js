"use strict";

/* =========================================================
   Peg Solitaire — Vista

   Todo lo que se dibuja en el canvas: tablero, fichas, hints, reloj y mensajes.
   No guarda el estado del juego ni decide nada: dibuja lo que le pasa el
   Controlador en cada cuadro (por eso cada dibujo empieza de cero).
   ========================================================= */

// Medidas del canvas: 7 casilleros de 80 px + 40 px de margen a cada lado = 640 px.
// tablero.svg está dibujado con estas mismas medidas.
const CASILLA = 80;
const MARGEN = 40;
const LADO_CANVAS = MARGEN * 2 + CASILLA * TAMANIO;
const RADIO_FICHA = 30;

// Botones dibujados en el canvas (rectángulos: esquina de arriba a la izquierda + medidas).
// panel: adentro del cartel de inicio/fin ("Jugar"). hud: abajo del reloj, mientras se juega ("Reiniciar").
const BOTONES = {
  panel: { x: 240, y: 500, ancho: 160, alto: 44 },
  hud: { x: 500, y: 88, ancho: 116, alto: 36, texto: "Reiniciar" },
};

// Colores del Design System (base.css): el canvas no puede leer las variables CSS
const COLOR_TEXTO = "#EDECF5"; // --texto
const COLOR_TEXTO_SECUNDARIO = "#8B88AD"; // --texto-secundario
const COLOR_SECUNDARIO = "#16E0F2"; // --secundario
const COLOR_ERROR = "#FF4D6D"; // --error
const COLOR_EXITO = "#3DDC97"; // --exito
const COLOR_PRIMARIO = "#7B2FF7"; // --primario (botones)
const COLOR_PRIMARIO_LUZ = "#9559F9"; // --primario-luz-20 (botón con el mouse encima)

// Color de cada invasor: se usa si su imagen no cargó y en las explosiones
const COLORES_FICHA = {
  cangrejo: "#16E0F2",
  calamar: "#B082FA",
  pulpo: "#FF4D6D",
  ovni: "#FFD23F",
};

class Vista {
  // Recibe el canvas y las imágenes ya cargadas: { fondo, cangrejo, calamar, pulpo, ovni }
  constructor(canvas, imagenes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.radioFicha = RADIO_FICHA;
    canvas.width = LADO_CANVAS;
    canvas.height = LADO_CANVAS;

    // Las imágenes son SVG: dibujar un SVG obliga al navegador a "pintarlo" de nuevo cada vez,
    // y el loop dibuja 33 por cuadro. Se pintan UNA vez en un canvas escondido y después
    // se dibuja ese canvas, que es solo copiar píxeles (como canvasDesde en Blocka).
    this.imagenes = {};
    for (const nombre in imagenes) {
      const lado = nombre === "fondo" ? LADO_CANVAS : RADIO_FICHA * 2 * 2; // fichas al doble: siguen nítidas levantadas
      this.imagenes[nombre] = Vista.aCanvas(imagenes[nombre], lado);
    }
  }

  // Pinta una imagen en un canvas nuevo (que no está en la página) de lado × lado y lo devuelve
  static aCanvas(imagen, lado) {
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    canvas.getContext("2d").drawImage(imagen, 0, 0, lado, lado);
    return canvas;
  }

  // Centro en píxeles del casillero (fila, columna). Ej.: (0, 3) → x 320, y 80
  aPixeles(fila, columna) {
    return {
      x: MARGEN + columna * CASILLA + CASILLA / 2,
      y: MARGEN + fila * CASILLA + CASILLA / 2,
    };
  }

  // Lo contrario: en qué casillero cae un punto del canvas. Ej.: (330, 95) → fila 0, columna 3
  aCasilla(x, y) {
    return {
      fila: Math.floor((y - MARGEN) / CASILLA),
      columna: Math.floor((x - MARGEN) / CASILLA),
    };
  }

  // ¿El punto (x, y) cae adentro del botón? Es la misma idea que encontrar una figura con el mouse
  static dentroDe(boton, x, y) {
    return x >= boton.x && x <= boton.x + boton.ancho && y >= boton.y && y <= boton.y + boton.alto;
  }

  // Dibuja un cuadro completo, de atrás para adelante (lo último que se dibuja queda arriba):
  // fondo → fichas quietas → explosiones → hints → ficha que vuelve → ficha arrastrada → HUD → mensaje
  // botonSobre = "panel", "hud" o null: el botón que tiene el mouse encima (se dibuja más claro)
  dibujar({ tablero, arrastre, volviendo, sobre, explosiones, tiempo, restante, mensaje, botonSobre }) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.imagenes.fondo, 0, 0, this.canvas.width, this.canvas.height);

    if (tablero) {
      for (const ficha of tablero.fichas()) {
        // La que se está moviendo no se dibuja en su casillero: se dibuja después, donde está el mouse
        if (ficha === arrastre?.ficha || ficha === volviendo?.ficha) continue;
        const { x, y } = this.aPixeles(ficha.fila, ficha.columna);
        if (ficha === sobre) this.dibujarResalte(x, y);
        this.dibujarFicha(ficha.tipo, x, y);
      }
    }

    for (const explosion of explosiones) this.dibujarExplosion(explosion, tiempo);

    if (arrastre) this.dibujarHints(arrastre.destinos, tiempo, arrastre.sobre);
    if (volviendo) this.dibujarFicha(volviendo.ficha.tipo, volviendo.x, volviendo.y);
    if (arrastre) this.dibujarFicha(arrastre.ficha.tipo, arrastre.x, arrastre.y, true);

    // Antes de la primera partida no hay Tablero: en vez de un número se muestra una raya
    this.dibujarHud(tablero ? tablero.cantidadFichas() : "—", restante);
    // Con cartel, el botón está en el cartel; sin cartel (jugando), Reiniciar va abajo del reloj
    if (mensaje) this.dibujarMensaje(mensaje, botonSobre === "panel");
    else this.dibujarBoton(BOTONES.hud, BOTONES.hud.texto, botonSobre === "hud");
  }

  // Dibuja una ficha con su imagen recortada en círculo.
  // levantada = true → más grande y con sombra abajo, como si estuviera en el aire.
  dibujarFicha(tipo, x, y, levantada = false) {
    const ctx = this.ctx;
    const r = levantada ? this.radioFicha * 1.15 : this.radioFicha;
    // save/restore: la sombra y el recorte (clip) quedan solo para esta ficha
    ctx.save();
    if (levantada) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 12;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    const imagen = this.imagenes[tipo];
    if (imagen) {
      // Primero un círculo relleno (para que la sombra tenga forma de ficha),
      // después se recorta con clip y la imagen solo se ve adentro del círculo
      ctx.fillStyle = "#0E0B16";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(imagen, x - r, y - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = COLORES_FICHA[tipo];
      ctx.fill();
    }
    ctx.restore();
  }

  // Anillo celeste alrededor de la ficha que está bajo el mouse: avisa que se puede agarrar
  dibujarResalte(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = COLOR_SECUNDARIO;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLOR_SECUNDARIO;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, this.radioFicha + 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Hints animados en los casilleros donde se puede soltar la ficha:
  // un anillo amarillo que late y una flecha que sube y baja apuntando al hueco.
  // No guarda nada: el movimiento sale de "tiempo", que cambia en cada cuadro.
  // sobre = el destino que está bajo la ficha arrastrada (se rellena: "si soltás, cae acá").
  dibujarHints(destinos, tiempo, sobre) {
    const ctx = this.ctx;
    // Math.sin va de -1 a 1; sumando 1 y dividiendo por 2 queda entre 0 y 1
    const pulso = (Math.sin(tiempo * 6) + 1) / 2;
    for (const d of destinos) {
      const { x, y } = this.aPixeles(d.fila, d.columna);

      if (d === sobre) {
        ctx.fillStyle = "rgba(255, 210, 63, 0.35)";
        ctx.beginPath();
        ctx.arc(x, y, this.radioFicha, 0, 2 * Math.PI);
        ctx.fill();
      }

      // save/restore: el brillo (shadow) es solo para el hint
      ctx.save();
      ctx.shadowColor = "#FFD23F";
      ctx.shadowBlur = 12;

      // Anillo: se agranda y se achica con el pulso (radio entre 0,7 y 1,1 de la ficha)
      ctx.strokeStyle = `rgba(255, 210, 63, ${1 - pulso * 0.4})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, this.radioFicha * (0.7 + pulso * 0.4), 0, 2 * Math.PI);
      ctx.stroke();

      // Flecha (triángulo con la punta hacia abajo) adentro del hueco, que sube y baja.
      // Va adentro y no arriba porque arriba casi siempre hay otra ficha que la taparía.
      const ya = y + 8 - pulso * 8; // y de la punta
      ctx.fillStyle = "#FFD23F";
      ctx.beginPath();
      ctx.moveTo(x - 10, ya - 14);
      ctx.lineTo(x + 10, ya - 14);
      ctx.lineTo(x, ya);
      ctx.fill();
      ctx.restore();
    }
  }

  // Invasor eliminado: 8 cuadraditos de su color que salen volando y se desvanecen.
  // progreso va de 0 (recién comido) a 1 (terminó) según cuánto tiempo pasó.
  dibujarExplosion({ x, y, tipo, inicio }, tiempo) {
    const progreso = Math.min(1, Math.max(0, (tiempo - inicio) / DURACION_EXPLOSION));
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1 - progreso;
    ctx.fillStyle = COLORES_FICHA[tipo];
    for (let i = 0; i < 8; i++) {
      const angulo = (i * Math.PI) / 4;
      const distancia = 10 + progreso * 36;
      ctx.fillRect(x + Math.cos(angulo) * distancia - 4, y + Math.sin(angulo) * distancia - 4, 8, 8);
    }
    ctx.restore();
  }

  // HUD en las esquinas de arriba (fuera de la cruz): invasores que quedan y tiempo que queda.
  // En los últimos 30 segundos el reloj se pone rojo.
  dibujarHud(cantidad, restante) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textBaseline = "top";

    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillStyle = COLOR_TEXTO_SECUNDARIO;
    ctx.textAlign = "left";
    ctx.fillText("INVASORES", 24, 24);
    ctx.textAlign = "right";
    ctx.fillText("TIEMPO", LADO_CANVAS - 24, 24);

    ctx.font = "700 28px Orbitron, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR_SECUNDARIO;
    ctx.fillText(String(cantidad), 24, 44);
    ctx.textAlign = "right";
    ctx.fillStyle = restante <= 30 ? COLOR_ERROR : COLOR_SECUNDARIO;
    ctx.fillText(formatearTiempo(restante), LADO_CANVAS - 24, 44);
    ctx.restore();
  }

  // Cartel de inicio y fin de partida: un recuadro abajo del centro, sin tapar el resto,
  // para que se sigan viendo los invasores que quedaron (sobre todo el del centro).
  // mensaje = { titulo, detalle, tipo, boton }; el tipo decide el color del título y del borde,
  // y boton es el texto del botón del cartel ("Jugar" o "Jugar de nuevo").
  dibujarMensaje({ titulo, detalle, tipo, boton }, botonResaltado) {
    const ctx = this.ctx;
    const colores = { inicio: COLOR_TEXTO, victoria: COLOR_EXITO, derrota: COLOR_ERROR };
    ctx.save();
    ctx.fillStyle = "rgba(27, 24, 48, 0.95)"; // --superficie
    ctx.strokeStyle = colores[tipo];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(60, 392, LADO_CANVAS - 120, 172, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 28px Orbitron, sans-serif";
    ctx.fillStyle = colores[tipo];
    ctx.fillText(titulo, LADO_CANVAS / 2, 428);

    ctx.font = "400 16px Inter, sans-serif";
    ctx.fillStyle = COLOR_TEXTO;
    ctx.fillText(detalle, LADO_CANVAS / 2, 468);
    ctx.restore();

    this.dibujarBoton(BOTONES.panel, boton, botonResaltado);
  }

  // Botón dibujado: rectángulo redondeado violeta con el texto centrado.
  // resaltado = true → el mouse está encima: violeta más claro (feedback de que se puede tocar)
  dibujarBoton(boton, texto, resaltado) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = resaltado ? COLOR_PRIMARIO_LUZ : COLOR_PRIMARIO;
    ctx.beginPath();
    ctx.roundRect(boton.x, boton.y, boton.ancho, boton.alto, 8);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 16px Inter, sans-serif";
    ctx.fillStyle = COLOR_TEXTO;
    ctx.fillText(texto, boton.x + boton.ancho / 2, boton.y + boton.alto / 2);
    ctx.restore();
  }
}

// 125 segundos → "02:05". Math.ceil: con 0,4 s todavía se ve "00:01" y no "00:00"
function formatearTiempo(segundos) {
  const enteros = Math.ceil(segundos);
  const minutos = Math.floor(enteros / 60);
  const resto = enteros % 60;
  return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}
