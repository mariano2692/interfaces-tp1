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
const DIRECCIONES = [[-2, 0], [2, 0], [0, -2], [0, 2]];
const esValida = (f, c) => (f >= 2 && f <= 4) || (c >= 2 && c <= 4);

function tableroInicial() {
  return Array.from({ length: TAMANIO }, (_, f) =>
    Array.from({ length: TAMANIO }, (_, c) => (esValida(f, c) ? !(f === CENTRO && c === CENTRO) : null))
  );
}

function iniciarJuego() {
  const contenedor = document.getElementById("tablero-contenedor");
  const grilla = document.getElementById("grilla");
  const mensaje = document.getElementById("mensaje");
  const botonJugar = document.getElementById("jugar");
  let estado = tableroInicial();
  let seleccion = null;
  let ultimoMovimiento = null;
  let jugando = false;

  const destinosDe = (f, c) =>
    DIRECCIONES.map(([df, dc]) => [f + df, c + dc, f + df / 2, c + dc / 2]).filter(
      ([df, dc, mf, mc]) => estado[df]?.[dc] === false && estado[mf]?.[mc] === true
    );

  const quedanMovimientos = () => estado.some((fila, f) => fila.some((v, c) => v && destinosDe(f, c).length > 0));
  const esDestino = (f, c) => seleccion && destinosDe(...seleccion).some(([df, dc]) => df === f && dc === c);

  function render() {
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
        casilla.tabIndex = jugando ? 0 : -1;
        casilla.setAttribute("aria-label", `Fila ${f + 1}, columna ${c + 1}: ${valor ? "ficha" : "vacío"}`);
        if (valor) casilla.innerHTML = INVASOR;
        if (seleccion?.[0] === f && seleccion[1] === c) casilla.classList.add("casilla--seleccionada");
        if (esDestino(f, c)) casilla.classList.add("casilla--destino");
        if (ultimoMovimiento?.destino[0] === f && ultimoMovimiento.destino[1] === c) casilla.classList.add("casilla--nueva");
        if (ultimoMovimiento?.comida[0] === f && ultimoMovimiento.comida[1] === c) casilla.classList.add("casilla--eliminada");
        grilla.appendChild(casilla);
      })
    );

    const fichas = estado.flat().filter(Boolean).length;
    mensaje.classList.remove("tablero__mensaje--victoria");
    if (!jugando) mensaje.textContent = "";
    else if (fichas === 1) {
      mensaje.textContent = "¡Ganaste! Detuviste la invasión";
      mensaje.classList.add("tablero__mensaje--victoria");
    } else if (!quedanMovimientos()) mensaje.textContent = `Sin movimientos. Quedaron ${fichas} fichas`;
    else mensaje.textContent = `Fichas: ${fichas}`;
  }

  function saltar(destinoF, destinoC) {
    const [sf, sc] = seleccion;
    const comida = [(sf + destinoF) / 2, (sc + destinoC) / 2];
    estado[sf][sc] = false;
    estado[comida[0]][comida[1]] = false;
    estado[destinoF][destinoC] = true;
    ultimoMovimiento = { destino: [destinoF, destinoC], comida };
    seleccion = null;
  }

  // Mouse y dedo: se aprieta sobre una ficha y se arrastra hasta un casillero vacío válido.
  // Si no se arrastra, queda seleccionada y se puede tocar el destino después.
  let arrastre = null;

  const casillaEn = (x, y) => document.elementFromPoint(x, y)?.closest(".casilla");
  const posicion = (casilla) => [Number(casilla.dataset.f), Number(casilla.dataset.c)];

  grilla.addEventListener("pointerdown", (e) => {
    const casilla = e.target.closest(".casilla");
    if (!casilla || !jugando || e.button !== 0) return;
    e.preventDefault();
    const [f, c] = posicion(casilla);
    ultimoMovimiento = null;

    if (esDestino(f, c)) {
      saltar(f, c);
      render();
      return;
    }
    if (!estado[f][c]) {
      seleccion = null;
      render();
      return;
    }

    seleccion = [f, c];
    render();
    if (destinosDe(f, c).length === 0) return; // sin saltos posibles: no se puede arrastrar

    const fantasma = document.createElement("div");
    fantasma.className = "arrastrada";
    fantasma.innerHTML = INVASOR;
    fantasma.hidden = true;
    document.body.appendChild(fantasma);
    arrastre = { fantasma, inicioX: e.clientX, inicioY: e.clientY, movido: false };
    document.addEventListener("pointermove", moverArrastre);
    document.addEventListener("pointerup", soltarArrastre, { once: true });
  });

  function moverArrastre(e) {
    const { fantasma, inicioX, inicioY } = arrastre;
    if (!arrastre.movido && Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 6) {
      arrastre.movido = true;
      fantasma.hidden = false;
      grilla.querySelector(".casilla--seleccionada")?.classList.add("casilla--origen");
    }
    fantasma.style.left = `${e.clientX}px`;
    fantasma.style.top = `${e.clientY}px`;

    grilla.querySelectorAll(".casilla--sobre").forEach((c) => c.classList.remove("casilla--sobre"));
    const sobre = casillaEn(e.clientX, e.clientY);
    if (sobre?.matches(".casilla--destino")) sobre.classList.add("casilla--sobre");
  }

  function soltarArrastre(e) {
    document.removeEventListener("pointermove", moverArrastre);
    const { fantasma, movido } = arrastre;
    fantasma.remove();
    arrastre = null;
    if (!movido) return; // fue un toque: la ficha queda seleccionada

    const destino = casillaEn(e.clientX, e.clientY);
    if (destino && esDestino(...posicion(destino))) saltar(...posicion(destino));
    render();
  }

  // Teclado (Enter o espacio sobre una casilla): mismo flujo de elegir ficha y destino
  grilla.addEventListener("click", (e) => {
    const casilla = e.target.closest(".casilla");
    if (!casilla || !jugando || e.detail !== 0) return; // detail 0 = click generado por teclado
    const [f, c] = posicion(casilla);
    ultimoMovimiento = null;
    if (esDestino(f, c)) saltar(f, c);
    else if (estado[f][c]) seleccion = seleccion?.[0] === f && seleccion[1] === c ? null : [f, c];
    else seleccion = null;
    render();
    grilla.querySelector(`[data-f="${f}"][data-c="${c}"]`)?.focus();
  });

  // "Jugar" habilita el tablero; después funciona como "Reiniciar"
  botonJugar.addEventListener("click", () => {
    estado = tableroInicial();
    seleccion = null;
    ultimoMovimiento = null;
    jugando = true;
    contenedor.classList.add("tablero--jugando");
    botonJugar.textContent = "Reiniciar";
    render();
    grilla.querySelector(".casilla--ficha")?.focus({ preventScroll: true });
  });

  render();
}

/* ---------- Mini tableros de la ayuda ---------- */

function dibujarMinis() {
  const base = tableroInicial();
  const estados = {
    // Solo queda la ficha del centro
    objetivo: base.map((fila, f) => fila.map((v, c) => (v === null ? null : f === CENTRO && c === CENTRO ? "resalte" : "hueco"))),
    // Antes: la ficha resaltada va a saltar hacia el centro vacío
    antes: base.map((fila, f) =>
      fila.map((v, c) => (v === null ? null : f === CENTRO && c === 1 ? "resalte" : f === CENTRO && c === CENTRO ? "hueco" : "ficha"))
    ),
    // Después: ocupó el centro y la del medio desapareció
    despues: base.map((fila, f) =>
      fila.map((v, c) => {
        if (v === null) return null;
        if (f === CENTRO && c === CENTRO) return "resalte";
        if (f === CENTRO && (c === 1 || c === 2)) return "hueco";
        return "ficha";
      })
    ),
  };

  document.querySelectorAll(".mini").forEach((mini) => {
    mini.innerHTML = estados[mini.dataset.mini]
      .flat()
      .map((tipo) => (tipo ? `<span class="mini__${tipo}"></span>` : "<span></span>"))
      .join("");
  });
}

/* ---------- Compartir y video ---------- */

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
  { nick: "PixelWarrior", fecha: "hace dos días", texto: "Adictivo. Me pasé una hora intentando dejar una sola ficha y no pude, pero volví al toque." },
  { nick: "kabeza", fecha: "hace una semana", texto: "Buenísimo para despejar la cabeza. Las animaciones de los invaders son un golazo." },
  { nick: "el_nano", fecha: "hace dos semanas", texto: "El mejor Peg Solitaire que probé. La estética arcade le da mucha identidad." },
];

function crearComentario({ nick, fecha, texto }, nuevo = false) {
  const li = document.createElement("li");
  li.className = "comentario" + (nuevo ? " comentario--nuevo" : "");
  li.innerHTML = `
    <div class="comentario__cabecera">
      <span class="comentario__avatar" aria-hidden="true"></span>
      <span class="texto-enfasis"></span>
      <span class="texto-chico comentario__fecha">${fecha}</span>
    </div>
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

  const pintar = (hasta) =>
    estrellas.forEach((e, i) => {
      e.classList.toggle("encendida", i < hasta);
      e.textContent = i < hasta ? "★" : "☆";
    });

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

    lista.prepend(crearComentario({ nick: USUARIO.nick, fecha: "recién", texto }, true));
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
  dibujarMinis();
  iniciarCompartir();
  iniciarComunidad();
  conectarBotonesDeCards(await obtenerJuegos());
}

iniciarPaginaJuego();
