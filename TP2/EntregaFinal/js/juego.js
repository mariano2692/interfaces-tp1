// [ESTUDIO] QUÉ ES ESTE ARCHIVO: la lógica de juego.html: el Peg Solitaire jugable, los mini tableros de la
// ayuda, compartir y la comunidad (reseñas). Usa comun.js y datos.js, que se cargan antes.
// Arranca por iniciarPaginaJuego(), al final del archivo.
"use strict";

/* =========================================================
   Página de juego — Peg Solitaire: Invasión Pixel
   ========================================================= */

// [ESTUDIO] Dibujo SVG de la ficha (un invader pixelado). currentColor = toma el color del CSS (cyan).
const INVASOR = `<svg class="invasor" viewBox="0 0 16 14" fill="currentColor" aria-hidden="true">
  <path d="M2 0h2v2H2zM12 0h2v2h-2zM4 2h2v2H4zM10 2h2v2h-2zM2 4h12v2H2zM0 6h4v2H0zM6 6h4v2H6zM12 6h4v2h-4zM0 8h16v2H0zM0 10h2v2H0zM2 10h12v2H2zM14 10h2v2h-2zM0 12h2v2H0zM4 12h2v2H4zM10 12h2v2h-2zM14 12h2v2h-2z"/>
</svg>`;

/* ---------- Tablero (cruz inglesa de 33 casilleros) ---------- */

// [ESTUDIO] *** EL TABLERO ES UNA MATRIZ (array de arrays) DE 7 × 7 ***
// Cada casilla vale: null = no existe (esquinas fuera de la cruz), true = tiene ficha, false = vacía.
// esValida: una casilla existe si su fila O su columna está entre 2 y 4 → forma la cruz de 33.
const TAMANIO = 7;
const CENTRO = 3;
const esValida = (f, c) => (f >= 2 && f <= 4) || (c >= 2 && c <= 4);

// [ESTUDIO] Arma el tablero del comienzo: todas las casillas válidas con ficha (true) menos el centro [3][3] (false).
// Array.from({ length: 7 }, ...) crea un array de 7 elementos calculando cada uno.
function tableroInicial() {
  return Array.from({ length: TAMANIO }, (_, f) =>
    Array.from({ length: TAMANIO }, (_, c) => {
      if (!esValida(f, c)) return null;
      return !(f === CENTRO && c === CENTRO);
    })
  );
}

// [ESTUDIO] DIBUJA LA MATRIZ EN EL HTML: borra la grilla y recorre la matriz fila por fila.
// null → un <span> vacío (hueco en la esquina). true/false → un <button> casilla; si tiene ficha,
// le mete el SVG del invader. data-f / data-c guardan fila y columna. aria-label describe la casilla.
// extra.decorar?.(...) → si le pasaron una función decorar, la llama (la usa render para poner clases).
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

// [ESTUDIO] Los 4 saltos posibles: 2 casillas arriba, abajo, izquierda o derecha. Nunca en diagonal.
const DIRECCIONES = [[-2, 0], [2, 0], [0, -2], [0, 2]];

// [ESTUDIO] EL JUEGO. Variables de estado: estado (la matriz), seleccion (ficha elegida [fila, col]),
// ultimoMovimiento (para animar), jugando (false hasta tocar Jugar), arrastre (datos del arrastre).
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

  // [ESTUDIO] *** REGLA DEL SALTO: a dónde puede saltar la ficha de [f, c] ***
  // Por cada dirección calcula el destino (2 casillas) y la del medio (df / 2). El salto vale si
  // el destino está vacío (=== false) y la del medio tiene ficha (=== true). ?. evita errores fuera del tablero.
  const destinosDe = (f, c) =>
    DIRECCIONES.map(([df, dc]) => [f + df, c + dc, f + df / 2, c + dc / 2]).filter(
      ([df, dc, mf, mc]) => estado[df]?.[dc] === false && estado[mf]?.[mc] === true
    );
  // [ESTUDIO] ¿Queda algún salto? some() = "¿alguno cumple?". Si ninguna ficha tiene destinos, se terminó.
  const quedanMovimientos = () => estado.some((fila, f) => fila.some((v, c) => v && destinosDe(f, c).length > 0));
  const esDestino = (f, c) => seleccion !== null && destinosDe(...seleccion).some(([df, dc]) => df === f && dc === c);
  const posicion = (casilla) => [Number(casilla.dataset.f), Number(casilla.dataset.c)];
  // [ESTUDIO] elementFromPoint(x, y) = qué elemento está debajo de esa posición del puntero.
  const casillaEn = (x, y) => document.elementFromPoint(x, y)?.closest("#grilla .casilla");

  // [ESTUDIO] *** RENDER: "EL ESTADO MANDA" ***
  // Después de cada jugada se redibuja todo el tablero a partir de la matriz, y decorar pone las clases
  // de estado (seleccionada, destino, nueva, eliminada) que el CSS pinta y anima.
  // Después cuenta las fichas (flat() aplana la matriz, filter(Boolean) deja las true) y escribe el mensaje:
  // 1 ficha → ganaste; sin movimientos → perdiste; si no → contador.
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

  // [ESTUDIO] *** SALTAR: la ficha elegida va a [f, c] ***
  // La ficha comida es la del MEDIO: el promedio entre origen y destino ((sf + f) / 2).
  // Origen → vacío (false), medio → vacío (false), destino → ficha (true).
  // Guarda ultimoMovimiento para que render ponga las animaciones aterrizar y explotar.
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
  // [ESTUDIO] ARRASTRAR (mouse y dedo con Pointer Events: los mismos eventos sirven para los dos).
  // pointerdown = apretar. Si la casilla es un destino válido, salta directo (modo "tocar y tocar").
  // Si es una ficha, la selecciona y prepara el arrastre: crea la copia (fantasma) oculta y escucha
  // pointermove (mover) y pointerup (soltar, { once: true } = una sola vez) en todo el documento.
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

  // [ESTUDIO] Al mover: si se movió más de 6 px (Math.hypot = distancia), recién ahí muestra la copia
  // (así un toque no se confunde con un arrastre). La copia sigue al puntero (left/top = clientX/clientY)
  // y marca con .casilla--sobre el destino válido que está debajo.
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

  // [ESTUDIO] Al soltar: deja de escuchar el movimiento y borra la copia. Si no se movió, fue un toque
  // (la ficha queda elegida). Si se soltó sobre un destino válido, salta. Siempre redibuja.
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
  // [ESTUDIO] TECLADO (Tab + Enter o espacio). El click que genera el teclado tiene e.detail === 0
  // (el del mouse tiene 1 o más): así no se mezcla con el arrastre. Elige, deselecciona o salta.
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
  // [ESTUDIO] JUGAR / REINICIAR: arma el tablero de cero, habilita el juego (jugando = true), pone
  // .tablero--jugando (el velo desaparece por CSS) y cambia el texto del botón a "Reiniciar".
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

// [ESTUDIO] MINI TABLEROS DE LA AYUDA: usa la misma forma de cruz (tableroInicial) y arma tres:
// objetivo (vacío con el centro resaltado), antes y después de un salto.
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

// [ESTUDIO] COMPARTIR: arma los links reales con la URL de la página (encodeURIComponent la convierte a un
// formato válido para una URL). alternar() abre o cierra el popover. Se cierra al hacer clic afuera
// o al elegir una opción. Copiar enlace usa navigator.clipboard.writeText (await: es asincrónico).
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

// [ESTUDIO] COMUNIDAD: 3 comentarios de ejemplo.
const COMENTARIOS = [
  { nick: "PixelWarrior", fecha: "hace dos días", texto: "Adictivo. Me pasé una hora intentando dejar una sola ficha y no pude, pero volví al toque." },
  { nick: "kabeza", fecha: "hace una semana", texto: "Buenísimo para despejar la cabeza. Las animaciones de los invaders son un golazo." },
  { nick: "el_nano", fecha: "hace dos semanas", texto: "El mejor Peg Solitaire que probé. La estética arcade le da mucha identidad." },
];

// [ESTUDIO] Arma un comentario. El texto que escribe el usuario va con textContent (no innerHTML):
// así, si alguien escribe HTML o código, se muestra como texto y no se ejecuta (seguridad).
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

// [ESTUDIO] RESEÑAS. pintar(n) llena las primeras n estrellas. Hover → pinta hasta esa estrella;
// clic → guarda el puntaje; al salir el mouse → vuelve a pintar el puntaje guardado.
// Al enviar: exige puntaje y 10 caracteres o más; si está bien, agrega la reseña ARRIBA (prepend)
// con la animación publicar, limpia el formulario y muestra un aviso.
function iniciarComunidad() {
  const lista = document.getElementById("comentarios");
  const form = document.getElementById("form-resena");
  const estrellas = [...document.querySelectorAll("#estrellas button")];
  const textarea = document.getElementById("resena-texto");
  let puntaje = 0;

  COMENTARIOS.forEach((c) => lista.appendChild(crearComentario(c)));

  // Estrellas vacías (☆) como en el Figma; se llenan (★) al pasar el mouse o elegir
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

// [ESTUDIO] *** PUNTO DE ARRANQUE DE LA PÁGINA DEL JUEGO (se llama en la última línea) ***
// Arma lo compartido, el juego, la ayuda, compartir y la comunidad.
// Las últimas líneas piden los juegos y conectan los botones Comprar/Jugar, pero esta página
// no tiene cards: hoy no cumplen ninguna función visible (quedaron de una versión anterior).
async function iniciarPaginaJuego() {
  iniciarComun();
  iniciarJuego();
  dibujarMinis();
  iniciarCompartir();
  iniciarComunidad();

  conectarBotonesDeCards(await obtenerJuegos());
}

iniciarPaginaJuego();
