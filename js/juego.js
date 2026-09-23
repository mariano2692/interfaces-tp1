"use strict";

/* =========================================================
   Página de juego — Peg Solitaire: Invasión Pixel
   ========================================================= */

const INVASOR = `<svg class="invasor" viewBox="0 0 16 14" fill="currentColor" aria-hidden="true">
  <path d="M2 0h2v2H2zM12 0h2v2h-2zM4 2h2v2H4zM10 2h2v2h-2zM2 4h12v2H2zM0 6h4v2H0zM6 6h4v2H6zM12 6h4v2h-4zM0 8h16v2H0zM0 10h2v2H0zM2 10h12v2H2zM14 10h2v2h-2zM0 12h2v2H0zM4 12h2v2H4zM10 12h2v2h-2zM14 12h2v2h-2z"/>
</svg>`;

/* ---------- Tablero (cruz inglesa de 33 casilleros) ---------- */

const TAMANIO = 7;
const CENTRO = 3;
const esValida = (f, c) => (f >= 2 && f <= 4) || (c >= 2 && c <= 4);

function tableroInicial() {
  return Array.from({ length: TAMANIO }, (_, f) =>
    Array.from({ length: TAMANIO }, (_, c) => {
      if (!esValida(f, c)) return null;
      return !(f === CENTRO && c === CENTRO);
    })
  );
}

function dibujarGrilla(grilla, estado, extra = {}) {
  grilla.innerHTML = "";
  estado.forEach((fila, f) =>
    fila.forEach((valor, c) => {
      if (valor === null) {
        grilla.appendChild(document.createElement("span"));
        return;
      }
      const casilla = document.createElement("button");
      casilla.type = "button";
      casilla.className = "casilla" + (valor ? " casilla--ficha" : "");
      casilla.dataset.f = f;
      casilla.dataset.c = c;
      casilla.setAttribute("aria-label", `Fila ${f + 1}, columna ${c + 1}: ${valor ? "ficha" : "vacío"}`);
      if (valor) casilla.innerHTML = INVASOR;
      extra.decorar?.(casilla, f, c);
      grilla.appendChild(casilla);
    })
  );
}

function iniciarJuego() {
  const grilla = document.getElementById("grilla");
  const contador = document.getElementById("fichas");
  const mensaje = document.getElementById("mensaje");
  let estado = tableroInicial();
  let seleccion = null;
  let ultimoMovimiento = null;

  const DIRECCIONES = [[-2, 0], [2, 0], [0, -2], [0, 2]];

  function destinosDe(f, c) {
    return DIRECCIONES.map(([df, dc]) => [f + df, c + dc, f + df / 2, c + dc / 2]).filter(
      ([df, dc, mf, mc]) => estado[df]?.[dc] === false && estado[mf]?.[mc] === true
    );
  }

  const quedanMovimientos = () =>
    estado.some((fila, f) => fila.some((v, c) => v && destinosDe(f, c).length > 0));

  function render() {
    const destinos = seleccion ? destinosDe(...seleccion) : [];
    dibujarGrilla(grilla, estado, {
      decorar(casilla, f, c) {
        if (seleccion && seleccion[0] === f && seleccion[1] === c) casilla.classList.add("casilla--seleccionada");
        if (destinos.some(([df, dc]) => df === f && dc === c)) casilla.classList.add("casilla--destino");
        if (ultimoMovimiento?.destino[0] === f && ultimoMovimiento.destino[1] === c) casilla.classList.add("casilla--nueva");
        if (ultimoMovimiento?.comida[0] === f && ultimoMovimiento.comida[1] === c) casilla.classList.add("casilla--eliminada");
      },
    });

    const fichas = estado.flat().filter(Boolean).length;
    contador.textContent = fichas;
    mensaje.classList.remove("tablero__mensaje--victoria");

    if (fichas === 1) {
      mensaje.textContent = "¡Ganaste! Detuviste la invasión";
      mensaje.classList.add("tablero__mensaje--victoria");
    } else if (!quedanMovimientos()) {
      mensaje.textContent = "No quedan movimientos. Probá de nuevo";
    } else {
      if (!seleccion) mensaje.textContent = "Elegí una ficha para mover";
      else mensaje.textContent = destinos.length ? "Elegí a dónde saltar" : "Esa ficha no puede saltar. Probá con otra";
    }
  }

  grilla.addEventListener("click", (e) => {
    const casilla = e.target.closest(".casilla");
    if (!casilla) return;
    const f = Number(casilla.dataset.f);
    const c = Number(casilla.dataset.c);
    ultimoMovimiento = null;

    if (casilla.classList.contains("casilla--destino")) {
      const [sf, sc] = seleccion;
      const comida = [(sf + f) / 2, (sc + c) / 2];
      estado[sf][sc] = false;
      estado[comida[0]][comida[1]] = false;
      estado[f][c] = true;
      ultimoMovimiento = { destino: [f, c], comida };
      seleccion = null;
    } else if (estado[f][c]) {
      const misma = seleccion && seleccion[0] === f && seleccion[1] === c;
      seleccion = misma ? null : [f, c];
    } else {
      seleccion = null;
    }
    render();
  });

  document.getElementById("reiniciar").addEventListener("click", () => {
    estado = tableroInicial();
    seleccion = null;
    ultimoMovimiento = null;
    render();
  });

  document.getElementById("pantalla-completa").addEventListener("click", () => {
    const contenedor = document.getElementById("tablero-contenedor");
    if (document.fullscreenElement) document.exitFullscreen();
    else contenedor.requestFullscreen?.();
  });

  render();
}

/* ---------- Galería: capturas del tablero en distintos momentos ---------- */

function dibujarGaleria() {
  const estados = {
    inicial: tableroInicial(),
    salto: (() => {
      const t = tableroInicial();
      // Dos saltos: (1,3) → (3,3) y después (2,1) → (2,3)
      t[1][3] = false;
      t[2][3] = false;
      t[3][3] = true;
      t[2][1] = false;
      t[2][2] = false;
      t[2][3] = true;
      return t;
    })(),
    final: tableroInicial().map((fila, f) => fila.map((v, c) => (v === null ? null : f === CENTRO && c === CENTRO))),
  };

  document.querySelectorAll(".galeria__marco").forEach((marco) => {
    const grilla = document.createElement("div");
    grilla.className = "grilla grilla--mini";
    dibujarGrilla(grilla, estados[marco.dataset.estado]);
    marco.appendChild(grilla);
  });
}

/* ---------- Compartir ---------- */

function iniciarCompartir() {
  const boton = document.getElementById("abrir-compartir");
  const popover = document.getElementById("popover-compartir");
  const url = encodeURIComponent(location.href);
  const texto = encodeURIComponent("Jugá Peg Solitaire: Invasión Pixel en NeoArcade");

  document.getElementById("compartir-whatsapp").href = `https://wa.me/?text=${texto}%20${url}`;
  document.getElementById("compartir-email").href = `mailto:?subject=${texto}&body=${url}`;
  document.getElementById("compartir-x").href = `https://x.com/intent/post?text=${texto}&url=${url}`;
  document.getElementById("compartir-facebook").href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;

  const alternar = (abrir) => {
    popover.hidden = !abrir;
    boton.setAttribute("aria-expanded", abrir);
  };

  boton.addEventListener("click", () => alternar(popover.hidden));
  document.addEventListener("click", (e) => {
    if (!popover.hidden && !popover.contains(e.target) && e.target !== boton) alternar(false);
  });
  popover.addEventListener("click", (e) => {
    if (e.target.closest(".compartir__opcion")) alternar(false);
  });

  document.getElementById("copiar-enlace").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      mostrarToast("Enlace copiado");
    } catch {
      mostrarToast("No se pudo copiar el enlace");
    }
  });

  document.getElementById("video").addEventListener("click", () => mostrarToast("El trailer estará disponible pronto"));
}

/* ---------- Comunidad ---------- */

const COMENTARIOS = [
  { nick: "PixelHunter", fecha: "hace 2 días", puntaje: 5, texto: "Lo terminé con una sola ficha en el centro después de muchos intentos. Muy adictivo." },
  { nick: "LauGamer", fecha: "hace 5 días", puntaje: 4, texto: "Me encanta que las fichas sean invasores. Sumaría un contador de movimientos." },
  { nick: "Tincho_88", fecha: "hace 1 semana", puntaje: 4, texto: "Ideal para una partida rápida entre clases." },
];

function crearComentario({ nick, fecha, puntaje, texto }, nuevo = false) {
  const li = document.createElement("li");
  li.className = "comentario" + (nuevo ? " comentario--nuevo" : "");
  li.innerHTML = `
    <span class="avatar">${nick[0].toUpperCase()}</span>
    <div class="comentario__cabecera">
      <span class="texto-enfasis"></span>
      <span class="texto-chico comentario__fecha">${fecha}</span>
    </div>
    <span class="comentario__puntaje" aria-label="${puntaje} de 5 estrellas">${"★".repeat(puntaje)}${"☆".repeat(5 - puntaje)}</span>
    <p class="comentario__texto"></p>`;
  // El texto del usuario va con textContent para no interpretar HTML
  li.querySelector(".texto-enfasis").textContent = nick;
  li.querySelector(".comentario__texto").textContent = texto;
  return li;
}

function iniciarComunidad() {
  const lista = document.getElementById("comentarios");
  const form = document.getElementById("form-resena");
  const estrellas = [...document.querySelectorAll("#estrellas button")];
  const textarea = document.getElementById("resena-texto");
  let puntaje = 0;

  COMENTARIOS.forEach((c) => lista.appendChild(crearComentario(c)));

  const pintar = (hasta) => estrellas.forEach((e, i) => e.classList.toggle("encendida", i < hasta));

  estrellas.forEach((estrella, i) => {
    estrella.addEventListener("mouseenter", () => pintar(i + 1));
    estrella.addEventListener("click", () => {
      puntaje = i + 1;
      estrellas.forEach((e, j) => e.setAttribute("aria-checked", j === i));
    });
  });
  document.getElementById("estrellas").addEventListener("mouseleave", () => pintar(puntaje));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = textarea.value.trim();
    const valido = puntaje > 0 && texto.length >= 10;
    textarea.closest(".campo").classList.toggle("campo--error", !valido);
    if (!valido) return;

    lista.prepend(crearComentario({ nick: USUARIO.nick, fecha: "recién", puntaje, texto }, true));
    form.reset();
    puntaje = 0;
    pintar(0);
    mostrarToast("¡Gracias! Publicamos tu reseña");
  });
}

/* ---------- Inicio ---------- */

async function iniciarPaginaJuego() {
  iniciarComun();
  iniciarJuego();
  dibujarGaleria();
  iniciarCompartir();
  iniciarComunidad();

  const juegos = await obtenerJuegos();
  const similares = juegos.filter((j) => j.url === null && (j.generos.includes("Puzzle") || j.generos.includes("Plataformas")));
  const contenedor = document.getElementById("similares");
  contenedor.innerHTML = crearCarrusel({ titulo: "Si te gustó, probá también", ancla: "similares-fila", juegos: similares });
  conectarCarruseles(contenedor);
  conectarBotonesDeCards(juegos);
}

iniciarPaginaJuego();
