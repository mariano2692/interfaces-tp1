"use strict";

/* =========================================================
   Peg Solitaire — Controlador

   Une el Modelo (Tablero) con la Vista: escucha al mouse, le pide al Tablero
   que haga los saltos y en cada cuadro le pasa a la Vista lo que tiene que dibujar.

   Arrastrar una ficha (mismo algoritmo que la filmina "Mouse Down"):
   - mousedown: encontrar la ficha bajo el mouse, levantarla y calcular sus destinos
   - mousemove: si hay una ficha arrastrándose, ponerla en la posición del mouse
   - mouseup:   si cae en un destino válido, el Tablero hace el salto;
                si no, la ficha vuelve a su casillero

   El dibujo NO se hace en cada evento sino en un loop (requestAnimationFrame),
   porque los hints y el reloj se mueven solos, aunque el mouse esté quieto.
   ========================================================= */

const TIEMPO_LIMITE = 180; // segundos de partida (3 minutos)
const DURACION_VUELTA = 0.2; // segundos que tarda una ficha soltada en lugar inválido en volver
const DURACION_EXPLOSION = 0.4; // segundos de la explosión del invasor comido

// Carteles del canvas
const MENSAJE_INICIO = { titulo: "Invasión Pixel", detalle: "Dejá un solo invasor antes de que se acabe el tiempo", tipo: "inicio", boton: "Jugar" };

class Controlador {
  // Recibe la Vista y el canvas. El juego arranca esperando:
  // tablero vacío (sin Tablero) y el cartel de inicio con el botón Jugar.
  constructor(vista, canvas) {
    this.vista = vista;
    this.canvas = canvas;

    this.tablero = null;
    this.estado = "esperando"; // "esperando" | "jugando" | "terminado"
    this.arrastre = null; // { ficha, x, y, destinos, sobre } mientras se arrastra una ficha
    this.volviendo = null; // { ficha, desdeX, desdeY, x, y, inicio } ficha que vuelve a su lugar
    this.sobre = null; // ficha bajo el mouse (se resalta para avisar que se puede agarrar)
    this.botonSobre = null; // "panel", "hud" o null: botón del canvas bajo el mouse
    this.explosiones = []; // { x, y, tipo, inicio } invasores recién comidos
    this.inicio = 0; // momento en que arrancó la partida (en ms, como lo da requestAnimationFrame)
    this.restante = TIEMPO_LIMITE;
    this.mensaje = MENSAJE_INICIO;

    // requestAnimationFrame llama a this.loop "suelta", sin el objeto adelante,
    // y adentro this sería undefined. bind crea una copia de loop con this fijo en este controlador.
    this.loop = this.loop.bind(this);
  }

  // Engancha los eventos y arranca el loop de dibujo (se llama una sola vez)
  iniciar() {
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    // move y up van en window: si el mouse se sale del canvas con la ficha, se sigue arrastrando
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    requestAnimationFrame(this.loop);
  }

  // Partida nueva: tablero lleno, reloj en 3:00 y sin cartel
  reiniciar() {
    this.tablero = new Tablero();
    this.estado = "jugando";
    this.arrastre = null;
    this.volviendo = null;
    this.sobre = null;
    this.explosiones = [];
    this.inicio = performance.now();
    this.restante = TIEMPO_LIMITE;
    this.mensaje = null;
    this.botonSobre = null;
  }

  // Posición del mouse en píxeles DEL CANVAS. Es la misma cuenta que piezaEn de Blocka:
  // clientX es respecto de la ventana, así que se resta dónde empieza el canvas (rect.left);
  // y si el CSS lo muestra más chico que sus 640 px reales, se escala con una regla de tres.
  posicionMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * this.canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * this.canvas.height) / rect.height,
    };
  }

  // La ficha que está bajo el punto (x, y) del canvas, o null
  fichaEn(x, y) {
    if (!this.tablero) return null;
    const { fila, columna } = this.vista.aCasilla(x, y);
    return this.tablero.fichaEn(fila, columna);
  }

  // El botón del canvas que está en (x, y), o null. Solo cuenta el que se está viendo:
  // con cartel, el del cartel ("panel"); jugando, el Reiniciar de abajo del reloj ("hud").
  botonEn(x, y) {
    if (this.mensaje) return Vista.dentroDe(BOTONES.panel, x, y) ? "panel" : null;
    if (this.estado === "jugando") return Vista.dentroDe(BOTONES.hud, x, y) ? "hud" : null;
    return null;
  }

  // mousedown: primero se fija si se tocó un botón (Jugar / Reiniciar → partida nueva).
  // Si no, encuentra la ficha y la levanta (feedback: se agranda y tiene sombra)
  // y calcula a dónde puede saltar (para dibujar los hints).
  onMouseDown(e) {
    if (e.button !== 0) return; // solo clic izquierdo
    const { x, y } = this.posicionMouse(e);
    if (this.botonEn(x, y)) {
      this.reiniciar();
      return;
    }
    if (this.estado !== "jugando") return;
    const ficha = this.fichaEn(x, y);
    if (!ficha || ficha === this.volviendo?.ficha) return;

    e.preventDefault(); // que el navegador no empiece a seleccionar texto al arrastrar
    this.arrastre = { ficha, x, y, destinos: this.tablero.obtenerMovimientosPosibles(ficha), sobre: null };
    this.sobre = null;
    this.canvas.style.cursor = "grabbing";
  }

  // mousemove: si se arrastra una ficha, sigue al mouse y se marca el destino que tiene abajo.
  // Si no se arrastra nada, se resalta lo que está bajo el mouse: un botón o una ficha
  // (el cursor cambia a "mano" para avisar que se puede tocar o agarrar).
  onMouseMove(e) {
    const { x, y } = this.posicionMouse(e);

    if (this.arrastre) {
      this.arrastre.x = x;
      this.arrastre.y = y;
      this.arrastre.sobre = this.destinoEn(x, y);
      return;
    }

    this.botonSobre = this.botonEn(x, y);
    this.sobre = this.estado === "jugando" && !this.botonSobre ? this.fichaEn(x, y) : null;
    if (this.botonSobre) this.canvas.style.cursor = "pointer";
    else if (this.sobre) this.canvas.style.cursor = "grab";
    else this.canvas.style.cursor = "default";
  }

  // mouseup: si se soltó sobre un destino válido, el Tablero hace el salto y se revisa
  // si el juego terminó. Si no, la ficha vuelve animada a su casillero (no cae).
  onMouseUp(e) {
    if (!this.arrastre) return;
    const { ficha, x, y } = this.arrastre;
    const destino = this.destinoEn(x, y);
    this.arrastre = null;
    this.canvas.style.cursor = "default";

    if (destino) {
      const centro = this.vista.aPixeles(destino.saltada.fila, destino.saltada.columna);
      this.explosiones.push({ x: centro.x, y: centro.y, tipo: destino.saltada.tipo, inicio: performance.now() / 1000 });
      this.tablero.mover(ficha, destino.fila, destino.columna);
      this.revisarFin();
    } else {
      this.volviendo = { ficha, desdeX: x, desdeY: y, x, y, inicio: performance.now() / 1000 };
    }
  }

  // El destino posible de la ficha arrastrada que está bajo (x, y), o undefined si no hay
  destinoEn(x, y) {
    const { fila, columna } = this.vista.aCasilla(x, y);
    return this.arrastre.destinos.find((d) => d.fila === fila && d.columna === columna);
  }

  // Se llama después de CADA salto: con una sola ficha se gana;
  // si quedan más pero ninguna puede saltar, se terminó la partida
  revisarFin() {
    const cantidad = this.tablero.cantidadFichas();
    if (cantidad === 1) {
      const ultima = this.tablero.fichas()[0];
      const enElCentro = ultima.fila === CENTRO && ultima.columna === CENTRO;
      this.terminar({
        titulo: "¡Ganaste!",
        detalle: enElCentro ? "Perfecto: el último invasor quedó en el centro" : "Detuviste la invasión: quedó un solo invasor",
        tipo: "victoria",
        boton: "Jugar de nuevo",
      });
    } else if (!this.tablero.hayMovimientos()) {
      this.terminar({
        titulo: "Sin movimientos",
        detalle: `Ningún invasor puede saltar. Quedaron ${cantidad}`,
        tipo: "derrota",
        boton: "Jugar de nuevo",
      });
    }
  }

  // Fin de la partida: el reloj se congela (restante deja de actualizarse) y aparece el cartel
  terminar(mensaje) {
    this.estado = "terminado";
    this.mensaje = mensaje;
    this.arrastre = null;
    this.sobre = null;
    this.canvas.style.cursor = "default";
  }

  // Loop: requestAnimationFrame lo llama unas 60 veces por segundo y le pasa "ahora" en ms.
  // Cada vuelta actualiza el reloj y las animaciones y redibuja todo.
  loop(ahora) {
    const tiempo = ahora / 1000; // en segundos

    if (this.estado === "jugando") {
      const transcurrido = (ahora - this.inicio) / 1000;
      this.restante = Math.max(0, TIEMPO_LIMITE - transcurrido);
      if (this.restante === 0) {
        this.terminar({
          titulo: "¡Se acabó el tiempo!",
          detalle: `Quedaron ${this.tablero.cantidadFichas()} invasores en el tablero`,
          tipo: "derrota",
          boton: "Jugar de nuevo",
        });
      }
    }

    this.animarVuelta(tiempo);
    this.explosiones = this.explosiones.filter((explosion) => tiempo - explosion.inicio < DURACION_EXPLOSION);

    this.vista.dibujar({
      tablero: this.tablero,
      arrastre: this.arrastre,
      volviendo: this.volviendo,
      sobre: this.sobre,
      explosiones: this.explosiones,
      tiempo,
      restante: this.restante,
      mensaje: this.mensaje,
      botonSobre: this.botonSobre,
    });
    requestAnimationFrame(this.loop);
  }

  // Mueve de a poco la ficha que vuelve, desde donde se soltó hasta el centro de su casillero.
  // t va de 0 a 1 según el tiempo que pasó; suave frena al final (ease-out, como el giro de Blocka).
  animarVuelta(tiempo) {
    if (!this.volviendo) return;
    const { ficha, desdeX, desdeY, inicio } = this.volviendo;
    const hasta = this.vista.aPixeles(ficha.fila, ficha.columna);
    const t = Math.min(1, (tiempo - inicio) / DURACION_VUELTA);
    const suave = 1 - (1 - t) ** 3;
    this.volviendo.x = desdeX + (hasta.x - desdeX) * suave;
    this.volviendo.y = desdeY + (hasta.y - desdeY) * suave;
    if (t === 1) this.volviendo = null;
  }
}
