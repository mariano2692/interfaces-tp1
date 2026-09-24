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

const DIRECCIONES = [[-2, 0], [2, 0], [0, -2], [0, 2]];

function iniciarJuego() {
  const contenedor = document.getElementById("tablero-contenedor");
  const grilla = document.getElementById("grilla");
  const mensaje = document.getElementById("mensaje");
  const botonJugar = document.getElementById("jugar");
  let estado = tableroInicial();
  let seleccion = null;
  let ultimoMovimiento = null;
  let jugando = false;
  let arrastre = null;

  const destinosDe = (f, c) =>
    DIRECCIONES.map(([df, dc]) => [f + df, c + dc, f + df / 2, c + dc / 2]).filter(
      ([df, dc, mf, mc]) => estado[df]?.[dc] === false && estado[mf]?.[mc] === true
    );
  const quedanMovimientos = () => estado.some((fila, f) => fila.some((v, c) => v && destinosDe(f, c).length > 0));
  const esDestino = (f, c) => seleccion !== null && destinosDe(...seleccion).some(([df, dc]) => df === f && dc === c);
  const posicion = (casilla) => [Number(casilla.dataset.f), Number(casilla.dataset.c)];
  const casillaEn = (x, y) => document.elementFromPoint(x, y)?.closest("#grilla .casilla");

  function render() {
    dibujarGrilla(grilla, estado, {
      decorar(casilla, f, c) {
        casilla.tabIndex = jugando ? 0 : -1;
        if (seleccion?.[0] === f && seleccion[1] === c) casilla.classList.add("casilla--seleccionada");
        if (esDestino(f, c)) casilla.classList.add("casilla--destino");
        if (ultimoMovimiento?.destino[0] === f && ultimoMovimiento.destino[1] === c) casilla.classList.add("casilla--nueva");
        if (ultimoMovimiento?.comida[0] === f && ultimoMovimiento.comida[1] === c) casilla.classList.add("casilla--eliminada");
      },
    });

    const fichas = estado.flat().filter(Boolean).length;
    mensaje.classList.remove("tablero__mensaje--victoria");
    if (!jugando) mensaje.textContent = "";
    else if (fichas === 1) {
      mensaje.textContent = "¡Ganaste! Detuviste la invasión";
      mensaje.classList.add("tablero__mensaje--victoria");
    } else if (!quedanMovimientos()) mensaje.textContent = `Sin movimientos. Quedaron ${fichas} fichas`;
    else mensaje.textContent = `Fichas: ${fichas}`;
  }

  function saltar(f, c) {
    const [sf, sc] = seleccion;
    const comida = [(sf + f) / 2, (sc + c) / 2];
    estado[sf][sc] = false;
    estado[comida[0]][comida[1]] = false;
    estado[f][c] = true;
    ultimoMovimiento = { destino: [f, c], comida };
    seleccion = null;
  }

  // Mouse y dedo: se aprieta sobre una ficha y se arrastra a un casillero válido.
  // Si se suelta sin arrastrar, la ficha queda elegida y se puede tocar el destino después.
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
    seleccion = estado[f][c] ? [f, c] : null;
    render();
    if (!seleccion || destinosDe(f, c).length === 0) return;

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

    grilla.querySelectorAll(".casilla--sobre").forEach((el) => el.classList.remove("casilla--sobre"));
    const sobre = casillaEn(e.clientX, e.clientY);
    if (sobre?.classList.contains("casilla--destino")) sobre.classList.add("casilla--sobre");
  }

  function soltarArrastre(e) {
    document.removeEventListener("pointermove", moverArrastre);
    const { fantasma, movido } = arrastre;
    fantasma.remove();
    arrastre = null;
    if (!movido) return; // fue un toque: la ficha queda elegida

    const destino = casillaEn(e.clientX, e.clientY);
    if (destino && esDestino(...posicion(destino))) saltar(...posicion(destino));
    render();
  }

  // Teclado (Enter o espacio sobre una casilla): el click que genera el teclado tiene detail 0
  grilla.addEventListener("click", (e) => {
    const casilla = e.target.closest(".casilla");
    if (!casilla || !jugando || e.detail !== 0) return;
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
  });

  render();
}

/* ---------- Mini tableros de las instrucciones ---------- */

function dibujarMinis() {
  const conTipo = (tipo) => tableroInicial().map((fila) => fila.map((v) => (v === null ? null : tipo)));
  const objetivo = conTipo("hueco");
  objetivo[CENTRO][CENTRO] = "resalte";

  // Antes: la ficha resaltada salta por encima de su vecina hacia el centro vacío
  const antes = conTipo("ficha");
  antes[CENTRO][CENTRO] = "hueco";
  antes[CENTRO][1] = "resalte";

  // Después: ocupó el centro y la ficha saltada desapareció
  const despues = conTipo("ficha");
  despues[CENTRO][1] = "hueco";
  despues[CENTRO][2] = "hueco";
  despues[CENTRO][CENTRO] = "resalte";

  const estados = { objetivo, antes, despues };
  document.querySelectorAll(".mini").forEach((mini) => {
    mini.innerHTML = estados[mini.dataset.mini]
      .flat()
      .map((tipo) => (tipo ? `<span class="mini__${tipo}"></span>` : "<span></span>"))
      .join("");
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

  // "Jugar ahora": sube al tablero y arranca la partida
  document.getElementById("jugar-ahora").addEventListener("click", () => {
    document.getElementById("tablero-contenedor").scrollIntoView({ behavior: "smooth", block: "center" });
    const jugar = document.getElementById("jugar");
    if (jugar.textContent === "Jugar") jugar.click();
  });
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
  dibujarMinis();
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
