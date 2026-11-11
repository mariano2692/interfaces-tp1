"use strict";

/* =========================================================
   Nave Pixel — el juego: une todas las partes

   Un solo loop con requestAnimationFrame (nada de un setInterval por
   cada cosa). En cada cuadro: actualizar (mover todo y revisar choques)
   y después dibujar (pasar las posiciones al DOM con transform).

   Las velocidades están en px/s y se multiplican por dt (segundos desde
   el cuadro anterior): así el juego va igual de rápido en una pantalla
   de 60 Hz que en una de 144 Hz. dt tiene un tope (DT_MAXIMO) para que,
   al volver de otra pestaña, nada pegue un salto enorme.

   Estados del juego: "inicio" (cartel de inicio), "jugando",
   "explotando" (la nave perdió la última vida y explota) y "fin".
   ========================================================= */

const VELOCIDAD = 200; // px/s a los que avanza el escenario (velocidad constante)
const FACTOR_LENTO = 0.45; // con un meteorito encima, el escenario va al 45 %
const SEGUNDOS_LENTO = 2.5;
const META = 60; // puntos para llegar a la base y ganar
const DT_MAXIMO = 0.05; // s: tope de dt
const CLAVE_RECORD = "nave-pixel-record";

class Juego {
  // Busca los elementos del HTML, crea las partes del juego, conecta los eventos y arranca el loop
  constructor() {
    this.marco = document.getElementById("nave-marco");
    this.escenario = document.getElementById("escenario");
    const mundo = document.getElementById("mundo");
    this.hud = {
      vidas: document.getElementById("hud-vidas"),
      puntos: document.getElementById("hud-puntos"),
      record: document.getElementById("hud-record"),
      aviso: document.getElementById("hud-aviso"),
    };
    this.pantallaInicio = document.getElementById("pantalla-inicio");
    this.pantallaFin = document.getElementById("pantalla-fin");
    this.botonJugar = document.getElementById("boton-jugar");

    // El orden importa: lo que se crea después queda adelante
    this.parallax = new Parallax(mundo);
    this.columnas = new Columnas(mundo);
    this.elementos = new Elementos(mundo);
    this.nave = new Nave(mundo, () => this.terminar(false));
    if (VER_HITBOX) this.escenario.classList.add("escenario--hitbox");

    this.estado = "inicio";
    this.puntos = 0;
    this.tiempo = 0;
    this.lento = 0;
    this.velocidad = VELOCIDAD;
    this.record = this.leerRecord();
    this.actualizarHud();

    this.conectarEventos();
    this.ajustarEscala();
    new ResizeObserver(() => this.ajustarEscala()).observe(this.marco);

    // bind: requestAnimationFrame llama a loop "suelto"; sin bind, adentro this no sería el juego
    this.loop = this.loop.bind(this);
    this.ultimo = null;
    requestAnimationFrame(this.loop);
  }

  // Clic, teclado y botones. Una entrada por pulsación: si la tecla queda apretada,
  // el navegador repite el keydown con e.repeat = true, y esos se ignoran.
  conectarEventos() {
    this.escenario.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return; // solo clic izquierdo, y no sobre un botón
      if (this.estado === "jugando") this.nave.impulsar();
    });

    document.addEventListener("keydown", (e) => {
      if (!["Space", "ArrowUp", "KeyW"].includes(e.code) || e.repeat) return;
      // Escribiendo una reseña o usando un botón: la tecla es para eso, no para el juego
      if (e.target instanceof Element && e.target.closest("input, textarea, button, a")) return;
      e.preventDefault(); // que la barra espaciadora no baje la página
      if (this.estado === "jugando") this.nave.impulsar();
      else if (this.estado !== "explotando" && !this.botonJugar.disabled) this.iniciar();
    });

    this.botonJugar.addEventListener("click", () => this.iniciar());
    document.getElementById("boton-otra").addEventListener("click", () => this.iniciar());
    document.getElementById("reiniciar").addEventListener("click", () => this.iniciar());
  }

  // Las imágenes ya se precargaron: se habilita el botón Jugar
  listo() {
    this.botonJugar.disabled = false;
    this.botonJugar.textContent = "Jugar";
    document.getElementById("reiniciar").disabled = false;
  }

  // Empieza una partida nueva desde cero
  iniciar() {
    this.nave.reiniciar();
    this.columnas.reiniciar();
    this.elementos.reiniciar();
    this.puntos = 0;
    this.tiempo = 0;
    this.lento = 0;
    this.hud.aviso.classList.remove("hud__aviso--visible");
    this.pantallaInicio.hidden = true;
    this.pantallaFin.hidden = true;
    this.estado = "jugando";
    this.actualizarHud();
    // Si el foco quedó en el botón que se apretó, la barra espaciadora lo volvería a apretar
    document.activeElement?.blur();
  }

  // Un cuadro: dt = segundos desde el anterior (con tope). Primero actualizar, después dibujar.
  loop(ahora) {
    const dt = this.ultimo === null ? 0 : Math.min((ahora - this.ultimo) / 1000, DT_MAXIMO);
    this.ultimo = ahora;
    this.actualizar(dt);
    this.dibujar();
    requestAnimationFrame(this.loop);
  }

  // Mueve todo según el estado. En el inicio el fondo avanza despacio; al explotar o terminar, se frena.
  actualizar(dt) {
    if (this.estado === "jugando") {
      this.tiempo += dt;
      if (this.lento > 0) {
        this.lento = Math.max(0, this.lento - dt);
        if (this.lento === 0) this.hud.aviso.classList.remove("hud__aviso--visible");
      }
      this.velocidad = this.lento > 0 ? VELOCIDAD * FACTOR_LENTO : VELOCIDAD;

      this.nave.actualizar(dt);
      const nueva = this.columnas.actualizar(dt, this.velocidad, this.tiempo);
      if (nueva && Math.random() < PROBABILIDAD_CRISTAL) {
        this.elementos.crear("cristal", nueva.x + ANCHO_COLUMNA / 2, nueva.centro);
      }
      this.elementos.actualizar(dt, this.velocidad);
      this.revisarChoques();

      const pasadas = this.columnas.contarPasadas(NAVE_X);
      if (pasadas > 0) this.sumarPuntos(pasadas);
    } else {
      this.velocidad = this.estado === "inicio" ? VELOCIDAD * 0.5 : 0;
    }
    // El fondo siempre usa la misma velocidad que las columnas (con el meteorito, también se frena)
    this.parallax.actualizar(dt, this.velocidad);
  }

  // Choques de la nave con las columnas, el suelo y los elementos
  revisarChoques() {
    const caja = this.nave.hitbox();

    const columna = this.columnas.chocaCon(caja);
    if (columna && this.nave.chocar()) {
      this.columnas.sacudir(columna);
      this.despuesDeGolpe();
    }

    if (caja.y + caja.h >= PISO) {
      this.nave.rebotar();
      if (this.nave.chocar()) this.despuesDeGolpe();
    }

    this.elementos.revisarChoques(caja, this);
  }

  // Después de perder una vida: si no quedan más, la nave explota (y al terminar la animación, fin)
  despuesDeGolpe() {
    this.actualizarHud();
    if (this.nave.vidas === 0) this.estado = "explotando";
  }

  // Efecto del cristal (Elementos.EFECTOS): suma puntos y la nave brilla
  agarrarCristal() {
    this.nave.brillar();
    this.sumarPuntos(PUNTOS_CRISTAL);
  }

  // Efecto del meteorito (Elementos.EFECTOS): el escenario se frena unos segundos y la nave tambalea
  frenar() {
    this.lento = SEGUNDOS_LENTO;
    this.nave.aturdir();
    this.hud.aviso.classList.add("hud__aviso--visible");
  }

  // Suma puntos, hace "saltar" el número del HUD y revisa si se llegó a la meta
  sumarPuntos(cantidad) {
    this.puntos = Math.min(META, this.puntos + cantidad);
    this.actualizarHud();
    this.hud.puntos.classList.remove("hud__puntos--sube");
    void this.hud.puntos.offsetWidth; // reinicia la animación aunque ya estuviera
    this.hud.puntos.classList.add("hud__puntos--sube");
    if (this.puntos >= META) this.terminar(true);
  }

  // Fin de la partida: gano = true si llegó a la meta, false si se quedó sin vidas
  terminar(gano) {
    this.estado = "fin";
    this.hud.aviso.classList.remove("hud__aviso--visible"); // si terminó frenada, el aviso ya no corresponde
    const nuevoRecord = this.puntos > this.record;
    if (nuevoRecord) {
      this.record = this.puntos;
      this.guardarRecord();
    }
    this.actualizarHud();

    document.getElementById("fin-titulo").textContent = gano ? "¡Llegaste a la base!" : "Nave destruida";
    this.pantallaFin.classList.toggle("nave-pantalla--gano", gano);
    document.getElementById("fin-detalle").textContent =
      `${this.puntos} de ${META} puntos en ${Math.round(this.tiempo)} s` + (nuevoRecord ? " · ¡Nuevo récord!" : "");
    this.pantallaFin.hidden = false;
  }

  // Pasa los números al HUD: una navecita por vida (las perdidas, apagadas), puntos y récord
  actualizarHud() {
    this.hud.vidas.innerHTML = "";
    for (let i = 0; i < VIDAS; i++) {
      crearDiv(i < this.nave.vidas ? "vida" : "vida vida--perdida", this.hud.vidas);
    }
    this.hud.puntos.textContent = `${this.puntos} / ${META}`;
    this.hud.record.textContent = this.record;
  }

  // Pasa las posiciones de todas las partes al DOM
  dibujar() {
    this.parallax.dibujar();
    this.columnas.dibujar();
    this.elementos.dibujar();
    this.nave.dibujar();
  }

  // El escenario mide siempre 960 × 540. Si el lugar es más angosto, se achica entero con
  // scale (la variable CSS --escala) y el marco toma la altura achicada.
  ajustarEscala() {
    const escala = Math.min(1, this.marco.clientWidth / ANCHO);
    this.marco.style.setProperty("--escala", escala);
  }

  // Récord guardado en el navegador. try/catch: en modo privado localStorage puede fallar
  leerRecord() {
    try {
      return Number(localStorage.getItem(CLAVE_RECORD)) || 0;
    } catch {
      return 0;
    }
  }

  // Guarda el récord en el navegador (si se puede)
  guardarRecord() {
    try {
      localStorage.setItem(CLAVE_RECORD, this.record);
    } catch {
      // sin localStorage el récord dura solo hasta recargar la página
    }
  }
}
