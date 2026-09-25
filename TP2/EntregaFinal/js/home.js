"use strict";

/* =========================================================
   Home: loading de 5 s, slider principal y carruseles
   ========================================================= */

const DURACION_CARGA = 5000;
const DURACION_SLIDE = 6000;
// Igual que el mainSlider del Figma: 3 destacados, el primero al centro y los otros dos como peeks
const IDS_DESTACADOS = [28, 3328, 58175]; // Red Dead Redemption 2, The Witcher 3, God of War

/* ---------- Loading simulado ---------- */

function simularCarga() {
  const carga = document.getElementById("carga");
  const porcentaje = document.getElementById("porcentaje");
  const relleno = document.getElementById("relleno");
  const texto = document.getElementById("carga-texto");
  const mensajes = [
    [0, "Cargando juegos…"],
    [35, "Armando los carruseles…"],
    [70, "Encendiendo los neones…"],
    [100, "¡Listo!"],
  ];

  return new Promise((resolver) => {
    const inicio = performance.now();

    function cuadro(ahora) {
      const avance = Math.min(Math.max(ahora - inicio, 0) / DURACION_CARGA, 1);
      const valor = Math.round(avance * 100);

      porcentaje.textContent = valor;
      relleno.style.width = `${valor}%`;
      carga.setAttribute("aria-valuenow", valor);
      texto.textContent = mensajes.filter(([desde]) => valor >= desde).pop()[1];

      if (avance < 1) {
        requestAnimationFrame(cuadro);
        return;
      }
      carga.classList.add("carga--fin");
      document.body.classList.remove("cargando");
      setTimeout(() => carga.remove(), 600);
      resolver();
    }

    requestAnimationFrame(cuadro);
  });
}

/* ---------- Ficha rápida ("Ver info" del slider) ---------- */

function abrirFicha(juego, disparador) {
  const ficha = document.getElementById("ficha");
  const { precio } = juego;
  const accion = precio.gratis
    ? `<button class="boton boton--primario" data-jugar="${juego.id}">Jugar gratis</button>`
    : `<button class="boton boton--primario" data-comprar="${juego.id}">Comprar · ${formatearPrecio(precio.final)}</button>`;

  ficha.innerHTML = `
    <img class="ficha-rapida__imagen" src="${juego.imagen}" alt="">
    <div class="ficha-rapida__cuerpo">
      <h2 class="titulo-seccion">${juego.nombre}</h2>
      <dl class="ficha-rapida__datos">
        <dt>Géneros</dt><dd>${juego.generos.join(", ")}</dd>
        <dt>Lanzamiento</dt><dd>${juego.anio}</dd>
        <dt>Plataformas</dt><dd>${juego.plataformas.join(", ")}</dd>
        <dt>Puntaje</dt><dd class="ficha-rapida__rating">${ICONOS.estrella} ${juego.rating.toFixed(1)} / 5</dd>
      </dl>
      <div class="ficha-rapida__acciones">
        ${accion}
        <button class="boton boton--secundario" data-cerrar-ficha>Cerrar</button>
      </div>
    </div>
    <button class="header__icono ficha-rapida__cerrar" data-cerrar-ficha aria-label="Cerrar">${ICONOS.cerrar}</button>`;

  ficha.showModal();
  ficha.addEventListener("close", () => disparador.focus(), { once: true });
}

function conectarFicha() {
  const ficha = document.getElementById("ficha");
  ficha.addEventListener("click", (e) => {
    // Clic en el fondo oscuro (fuera de la ficha) o en un botón de cerrar
    if (e.target === ficha || e.target.closest("[data-cerrar-ficha]")) ficha.close();
    // Comprar desde la ficha: la compra la maneja conectarBotonesDeCards; acá solo se cierra
    if (e.target.closest("[data-comprar], [data-jugar]")) ficha.close();
  });
}

/* ---------- Slider principal ---------- */

function crearSlider(destacados) {
  const slider = document.getElementById("slider");
  const escenario = document.getElementById("slider-escenario");
  const indicadores = document.getElementById("slider-indicadores");
  const peekIzq = slider.querySelector(".slider__peek--izq");
  const peekDer = slider.querySelector(".slider__peek--der");

  slider.style.setProperty("--duracion-slide", `${DURACION_SLIDE}ms`);

  escenario.innerHTML = destacados
    .map(
      (juego, i) => `
        <article class="slide" aria-roledescription="slide" aria-label="${i + 1} de ${destacados.length}">
          <img class="slide__fondo" src="${juego.imagenGrande}" alt="">
          <div class="slide__info">
            <h2 class="slide__titulo">${juego.nombre}</h2>
            <button class="boton-info" data-info="${juego.id}">Ver info</button>
          </div>
        </article>`
    )
    .join("");

  indicadores.innerHTML = destacados
    .map((juego, i) => `<button class="indicador" aria-label="Ir a ${juego.nombre}" data-indice="${i}"></button>`)
    .join("");

  const slides = [...escenario.children];
  const puntos = [...indicadores.children];
  const total = slides.length;
  let actual = 0;
  let temporizador;
  let animando = false;

  const vecino = (paso) => (actual + paso + total) % total;

  function actualizarPeeks(animar) {
    [[peekIzq, vecino(-1)], [peekDer, vecino(1)]].forEach(([peek, indice]) => {
      peek.querySelector("img").src = destacados[indice].imagen;
      if (!animar) return;
      peek.classList.remove("peek--cambio");
      void peek.offsetWidth;
      peek.classList.add("peek--cambio");
    });
  }

  function marcarIndicador() {
    puntos.forEach((punto, i) => {
      punto.classList.toggle("indicador--activo", i === actual);
      punto.setAttribute("aria-current", i === actual);
    });
  }

  function irA(destino, sentido) {
    if (destino === actual || animando) return;
    animando = true;

    const saliente = slides[actual];
    const entrante = slides[destino];
    const direccion = sentido ?? (destino > actual ? 1 : -1);

    saliente.classList.remove("slide--activo");
    saliente.classList.add(direccion > 0 ? "slide--sale-izq" : "slide--sale-der");
    entrante.classList.add("slide--activo", direccion > 0 ? "slide--entra-der" : "slide--entra-izq");

    // animationend también llega desde los hijos (texto, imagen): solo cuenta la del slide
    entrante.addEventListener("animationend", function alTerminar(e) {
      if (e.target !== entrante) return;
      entrante.removeEventListener("animationend", alTerminar);
      saliente.className = "slide";
      entrante.className = "slide slide--activo";
      animando = false;
    });

    actual = destino;
    marcarIndicador();
    actualizarPeeks(true);
    reiniciarAutoplay();
  }

  const siguiente = () => irA(vecino(1), 1);
  const anterior = () => irA(vecino(-1), -1);

  function reiniciarAutoplay() {
    clearInterval(temporizador);
    if (!slider.classList.contains("slider--pausado")) temporizador = setInterval(siguiente, DURACION_SLIDE);
    // Reinicia la barrita del indicador activo
    const activo = puntos[actual];
    activo.classList.remove("indicador--activo");
    void activo.offsetWidth;
    activo.classList.add("indicador--activo");
  }

  peekDer.addEventListener("click", siguiente);
  peekIzq.addEventListener("click", anterior);
  indicadores.addEventListener("click", (e) => {
    const punto = e.target.closest(".indicador");
    if (punto) irA(Number(punto.dataset.indice));
  });

  // Pausa mientras el usuario está mirando o usando el slider
  const pausar = (pausado) => () => {
    slider.classList.toggle("slider--pausado", pausado);
    if (pausado) clearInterval(temporizador);
    else temporizador = setInterval(siguiente, DURACION_SLIDE);
  };
  escenario.addEventListener("mouseenter", pausar(true));
  escenario.addEventListener("mouseleave", pausar(false));

  // Deslizar con el dedo en mobile
  let inicioX = null;
  escenario.addEventListener("pointerdown", (e) => (inicioX = e.clientX));
  escenario.addEventListener("pointerup", (e) => {
    if (inicioX === null) return;
    const delta = e.clientX - inicioX;
    if (Math.abs(delta) > 50) (delta < 0 ? siguiente : anterior)();
    inicioX = null;
  });

  document.addEventListener("keydown", (e) => {
    if (!slider.contains(document.activeElement)) return;
    if (e.key === "ArrowRight") siguiente();
    if (e.key === "ArrowLeft") anterior();
  });

  escenario.addEventListener("click", (e) => {
    const info = e.target.closest("[data-info]");
    if (info) abrirFicha(destacados.find((j) => String(j.id) === info.dataset.info), info);
  });

  slides[0].classList.add("slide--activo");
  marcarIndicador();
  actualizarPeeks(false);

  // El autoplay arranca cuando termina el loading
  return () => reiniciarAutoplay();
}

/* ---------- Filas de carruseles ---------- */

const POR_FILA = 8;
const tieneGenero = (...generos) => (j) => generos.some((g) => j.generos.includes(g));
const porRating = (a, b) => b.rating - a.rating;
// Mezcla fija (siempre igual) para que "Recomendados" no repita el orden de "Mejores puntuados"
const mezclaFija = (a, b) => ((a.id * 7919) % 97) - ((b.id * 7919) % 97);

// Cada juego aparece en una sola fila, así ninguna imagen se repite en el Home.
// Las categorías chicas eligen primero para que no se queden sin juegos.
function armarFilas(juegos) {
  const [peg, ...resto] = juegos;
  const usados = new Set();
  const tomar = (lista, cantidad = POR_FILA) => {
    const elegidos = lista.filter((j) => !usados.has(j.id)).slice(0, cantidad);
    elegidos.forEach((j) => usados.add(j.id));
    return elegidos;
  };

  // Las 3 cards grandes: las ofertas mejor puntuadas (sin los del slider; eligen primero para no repetirse en los carruseles)
  const ofertas = resto.filter((j) => j.precio.descuento && !IDS_DESTACADOS.includes(j.id)).sort(porRating);
  const grandes = tomar(ofertas, 3);
  // El banner "Próximamente": el juego más nuevo de la API (tampoco se repite abajo)
  const [banner] = tomar(resto.filter((j) => !IDS_DESTACADOS.includes(j.id)).sort((a, b) => b.anio - a.anio), 1);
  const gratis = tomar(resto.filter((j) => j.precio.gratis));
  const enOferta = tomar(ofertas);
  const puzzle = tomar(resto.filter(tieneGenero("Puzzle", "Plataformas")), POR_FILA - 1);
  const indie = tomar(resto.filter(tieneGenero("Indie")));
  const aventura = tomar(resto.filter(tieneGenero("Aventura")));
  const rpg = tomar(resto.filter(tieneGenero("RPG")));
  const shooter = tomar(resto.filter(tieneGenero("Shooter")));
  const mejores = tomar([...resto].sort(porRating));
  const accion = tomar(resto.filter(tieneGenero("Acción")));
  const recomendados = tomar([...resto].sort(mezclaFija), POR_FILA - 1);

  // Mismo nombre que en el menú hamburguesa (Nielsen #4: consistencia)
  const fila = (ancla, juegosFila) => ({ titulo: tituloDeCategoria(ancla), ancla, juegos: juegosFila });

  return [
    { titulo: "Recomendados para vos", ancla: "recomendados", juegos: [peg, ...recomendados] },
    fila("mejores-puntuados", mejores),
    { tipo: "grandes", juegos: grandes },
    fila("accion", accion),
    fila("shooter", shooter),
    fila("rpg", rpg),
    fila("aventura", aventura),
    { tipo: "banner", juego: banner },
    fila("indie", indie),
    fila("puzzle", [peg, ...puzzle]),
    fila("ofertas", enOferta),
    fila("gratis", gratis),
  ];
}

/* ---------- Fila de cards grandes y banner (como en el Figma) ---------- */

// Card grande: imagen ancha con el precio en un recuadro arriba a la derecha; abajo título y botón
function crearCardGrande(juego) {
  const { precio } = juego;
  const precioHtml = precio.descuento
    ? `<span class="precio precio--oferta">${formatearPrecio(precio.final)}<s>${formatearPrecio(precio.lista)}</s></span>`
    : `<span class="precio">${formatearPrecio(precio.final)}</span>`;

  return `
    <article class="card card--grande">
      <div class="card__imagen">
        <img src="${juego.imagen}" alt="${juego.nombre}" loading="lazy">
        <div class="card-grande__precio">${precioHtml}</div>
      </div>
      <div class="card-grande__pie">
        <h3 class="card__titulo" title="${juego.nombre}">${juego.nombre}</h3>
        <button class="card-boton card-boton--comprar" data-comprar="${juego.id}">Comprar</button>
      </div>
    </article>`;
}

function crearFilaGrandes({ juegos }) {
  return `
    <section class="fila-grandes" aria-label="Ofertas destacadas">
      ${juegos.map(crearCardGrande).join("")}
    </section>`;
}

// Banner a todo el ancho: usa la imagen en alta porque es mucho más grande que una card
function crearBanner({ juego }) {
  if (!juego) return "";
  return `
    <section class="banner" aria-label="Próximamente: ${juego.nombre}">
      <img src="${juego.imagenGrande || juego.imagen}" alt="${juego.nombre}" loading="lazy">
      <span class="banner__etiqueta">Próximamente</span>
    </section>`;
}

const crearFila = (fila) =>
  fila.tipo === "grandes" ? crearFilaGrandes(fila) : fila.tipo === "banner" ? crearBanner(fila) : crearCarrusel(fila);

/* ---------- Inicio ---------- */

async function iniciarHome() {
  iniciarComun();
  const carga = simularCarga();

  const juegos = await obtenerJuegos();
  const destacados = IDS_DESTACADOS.map((id) => juegos.find((j) => j.id === id)).filter(Boolean);

  const arrancarSlider = crearSlider(destacados);
  const contenedor = document.getElementById("carruseles");
  contenedor.innerHTML = armarFilas(juegos).map(crearFila).join("");
  conectarCarruseles(contenedor);
  conectarBotonesDeCards(juegos);
  conectarFicha();

  await carga;
  arrancarSlider();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

iniciarHome();
