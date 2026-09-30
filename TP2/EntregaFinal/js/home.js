// [ESTUDIO] QUÉ ES ESTE ARCHIVO: la lógica propia del Home: loading, slider principal, ficha rápida
// y armado de las filas de carruseles. Usa funciones de comun.js y datos.js, que se cargan antes.
// Arranca por la función iniciarHome(), que está AL FINAL del archivo.
"use strict";

/* =========================================================
   Home: loading de 5 s, slider principal y carruseles
   ========================================================= */

// [ESTUDIO] Constantes (en MAYÚSCULAS por convención): duraciones en ms e ids de los 3 juegos del slider.
const DURACION_CARGA = 5000;
const DURACION_SLIDE = 6000;
// Igual que el mainSlider del Figma: 3 destacados, el primero al centro y los otros dos como peeks
const IDS_DESTACADOS = [28, 3328, 58175]; // Red Dead Redemption 2, The Witcher 3, God of War

/* ---------- Loading simulado ---------- */

// [ESTUDIO] *** LOADING: ANIMACIÓN PROCEDURAL (filmina de Animaciones) ***
// El valor no está prefijado en un keyframe: se calcula con código en cada cuadro, igual que el
// reloj de la cátedra (AnalogClock), pero con requestAnimationFrame en vez de setTimeout.
// Devuelve una Promise: una "promesa" de que va a terminar. iniciarHome la espera con await.
function simularCarga() {
  const carga = document.getElementById("carga");
  const porcentaje = document.getElementById("porcentaje");
  const relleno = document.getElementById("relleno");

  return new Promise((resolver) => {
    // [ESTUDIO] performance.now() = el momento exacto en que arranca, en milisegundos.
    const inicio = performance.now();

    // [ESTUDIO] Se ejecuta en CADA CUADRO de pantalla (unas 60 veces por segundo).
    // avance = tiempo que pasó / 5000 → va de 0 a 1 (Math.min lo frena en 1).
    // valor = avance × 100 redondeado → el número del porcentaje (0 a 100).
    // Con ese valor escribe el número, cambia el ancho de la barra y aria-valuenow (accesibilidad).
    function cuadro(ahora) {
      const avance = Math.min(Math.max(ahora - inicio, 0) / DURACION_CARGA, 1);
      const valor = Math.round(avance * 100);

      porcentaje.textContent = valor;
      relleno.style.width = `${valor}%`;
      carga.setAttribute("aria-valuenow", valor);

      // [ESTUDIO] Si no llegó al final, pide el próximo cuadro (requestAnimationFrame) y corta acá (return).
      if (avance < 1) {
        requestAnimationFrame(cuadro);
        return;
      }
      // [ESTUDIO] Llegó a 100 %: animación de salida (CSS), habilita el scroll, borra el loading a los 600 ms
      // y resolver() avisa que la promesa terminó.
      carga.classList.add("carga--fin");
      document.body.classList.remove("cargando");
      setTimeout(() => carga.remove(), 600);
      resolver();
    }

    requestAnimationFrame(cuadro);
  });
}

/* ---------- Ficha rápida ("Ver info" del slider) ---------- */

// [ESTUDIO] FICHA RÁPIDA: arma el contenido con los datos del juego y lo abre con showModal().
// Si el juego es gratis el botón dice "Jugar gratis"; si no, "Comprar" con el precio.
// Al cerrarse, focus() devuelve el foco del teclado al botón Ver info que la abrió.
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

// [ESTUDIO] Cierra la ficha con clic en el fondo (e.target === ficha: tocaste el <dialog> mismo, no su contenido),
// con los botones Cerrar o ✕, o al Comprar.
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

/* [ESTUDIO] crearSlider arma el slider y conecta todos sus eventos.
   Recibe "destacados": un array con los 3 juegos del slider (vienen de la API).
   Idea clave: el JS NO anima. Solo decide QUÉ slide va y le pone clases;
   las animaciones están en home.css (@keyframes entra-der, sale-izq, etc.). */
function crearSlider(destacados) {
  const slider = document.getElementById("slider");
  const escenario = document.getElementById("slider-escenario");
  const indicadores = document.getElementById("slider-indicadores");
  const peekIzq = slider.querySelector(".slider__peek--izq");
  const peekDer = slider.querySelector(".slider__peek--der");

  // [ESTUDIO] Arriba: busca en el HTML los elementos que va a usar (getElementById / querySelector).

  // [ESTUDIO] Le pasa al CSS la duración del autoplay (6000ms) como variable --duracion-slide.
  // La usa la barrita del indicador (animation: llenar var(--duracion-slide)).
  slider.style.setProperty("--duracion-slide", `${DURACION_SLIDE}ms`);

  // [ESTUDIO] Crea el HTML de los 3 slides. map() recorre los juegos y por cada uno arma un
  // texto con backticks (template literal); ${...} mete el dato del juego. join("") los une.
  // innerHTML = ... escribe todo ese HTML adentro del escenario.
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

  // [ESTUDIO] Estado del slider:
  // - slides / puntos: arrays con los slides y los indicadores ([...] convierte la lista del HTML en array)
  // - actual: índice del slide que se ve (0, 1 o 2)
  // - temporizador: el reloj del autoplay (setInterval)
  // - animando: true mientras dura un cambio, para no aceptar otro clic encima
  const slides = [...escenario.children];
  const puntos = [...indicadores.children];
  const total = slides.length;
  let actual = 0;
  let temporizador;
  let animando = false;

  // [ESTUDIO] Devuelve el índice del vecino, dando la vuelta: con 3 slides,
  // desde el 2 el siguiente es el 0, y desde el 0 el anterior es el 2.
  // % es el resto de la división: (2 + 1 + 3) % 3 = 0.
  const vecino = (paso) => (actual + paso + total) % total;

  // [ESTUDIO] Pone en cada peek la imagen del vecino (izquierdo = anterior, derecho = siguiente).
  // Si animar es true, reinicia la animación cambio-peek:
  //   1. saca la clase, 2. void offsetWidth obliga al navegador a "darse cuenta" de que se sacó,
  //   3. la vuelve a poner. Sin el paso 2, la animación no se repetiría.
  function actualizarPeeks(animar) {
    [[peekIzq, vecino(-1)], [peekDer, vecino(1)]].forEach(([peek, indice]) => {
      peek.querySelector("img").src = destacados[indice].imagen;
      if (!animar) return;
      peek.classList.remove("peek--cambio");
      void peek.offsetWidth;
      peek.classList.add("peek--cambio");
    });
  }

  // [ESTUDIO] classList.toggle(clase, condición): pone la clase si la condición es true
  // y la saca si es false. Solo el indicador del slide actual queda activo.
  function marcarIndicador() {
    puntos.forEach((punto, i) => {
      punto.classList.toggle("indicador--activo", i === actual);
      punto.setAttribute("aria-current", i === actual);
    });
  }

  // [ESTUDIO] *** LA FUNCIÓN MÁS IMPORTANTE: cambia del slide actual al slide "destino". ***
  // sentido: 1 = avanzar, -1 = retroceder.
  function irA(destino, sentido) {
    // Si ya estoy en ese slide, o hay una animación en curso, no hago nada (prevención de errores).
    if (destino === actual || animando) return;
    animando = true;

    const saliente = slides[actual]; // el que se va
    const entrante = slides[destino]; // el que llega
    // Si no me dijeron el sentido (clic en un indicador), lo calculo: más adelante = 1, más atrás = -1.
    // ?? significa "si sentido no tiene valor, usá lo de la derecha".
    const direccion = sentido ?? (destino > actual ? 1 : -1);

    // ACÁ ARRANCAN LAS ANIMACIONES: el JS solo pone clases, el CSS anima.
    // Operador ternario  condición ? A : B  → si avanzo usa A, si retrocedo usa B.
    // Avanzar:    el viejo sale a la izquierda y el nuevo entra desde la derecha.
    // Retroceder: el viejo sale a la derecha y el nuevo entra desde la izquierda.
    saliente.classList.remove("slide--activo");
    saliente.classList.add(direccion > 0 ? "slide--sale-izq" : "slide--sale-der");
    entrante.classList.add("slide--activo", direccion > 0 ? "slide--entra-der" : "slide--entra-izq");

    // [ESTUDIO] animationend = evento que avisa cuando termina una animación CSS.
    // Cuando termina, limpia las clases de animación y deja todo listo para el próximo cambio.
    // animationend también llega desde los hijos (texto, imagen): solo cuenta la del slide
    entrante.addEventListener("animationend", function alTerminar(e) {
      if (e.target !== entrante) return;
      entrante.removeEventListener("animationend", alTerminar);
      saliente.className = "slide";
      entrante.className = "slide slide--activo";
      animando = false;
    });

    // Actualiza el estado: ahora el actual es el nuevo, y se actualizan indicadores, peeks y autoplay.
    actual = destino;
    marcarIndicador();
    actualizarPeeks(true);
    reiniciarAutoplay();
  }

  // [ESTUDIO] Atajos: siguiente = ir al vecino de la derecha avanzando; anterior = al revés.
  const siguiente = () => irA(vecino(1), 1);
  const anterior = () => irA(vecino(-1), -1);

  // [ESTUDIO] setInterval(función, ms) ejecuta la función cada tantos ms: cada 6 s llama a siguiente().
  // clearInterval lo frena. Se reinicia en cada cambio para que el próximo salto sea 6 s después.
  // Es parecido al reloj de la cátedra (AnalogClock), que usa setTimeout para redibujar.
  function reiniciarAutoplay() {
    clearInterval(temporizador);
    if (!slider.classList.contains("slider--pausado")) temporizador = setInterval(siguiente, DURACION_SLIDE);
    // Reinicia la barrita del indicador activo
    const activo = puntos[actual];
    activo.classList.remove("indicador--activo");
    void activo.offsetWidth;
    activo.classList.add("indicador--activo");
  }

  // [ESTUDIO] EVENTOS: addEventListener("evento", función) = "cuando pase esto, ejecutá esto".
  // Clic en el peek derecho → siguiente; en el izquierdo → anterior.
  // En los indicadores hay UN solo listener para los 3: con closest(".indicador") se fija
  // cuál se tocó, y con dataset.indice lee su número (el atributo data-indice del HTML).
  peekDer.addEventListener("click", siguiente);
  peekIzq.addEventListener("click", anterior);
  indicadores.addEventListener("click", (e) => {
    const punto = e.target.closest(".indicador");
    if (punto) irA(Number(punto.dataset.indice));
  });

  // Pausa mientras el usuario está mirando o usando el slider
  // [ESTUDIO] mouseenter = entra el mouse, mouseleave = sale. Al entrar: pone .slider--pausado
  // (el CSS congela la barrita con animation-play-state: paused) y frena el autoplay.
  // Al salir: saca la clase y vuelve a arrancar el autoplay.
  const pausar = (pausado) => () => {
    slider.classList.toggle("slider--pausado", pausado);
    if (pausado) clearInterval(temporizador);
    else temporizador = setInterval(siguiente, DURACION_SLIDE);
  };
  escenario.addEventListener("mouseenter", pausar(true));
  escenario.addEventListener("mouseleave", pausar(false));

  // Deslizar con el dedo en mobile
  // [ESTUDIO] pointerdown guarda dónde apoyaste (clientX = posición horizontal).
  // pointerup calcula cuánto te moviste (delta). Si fueron más de 50 px:
  // hacia la izquierda (delta negativo) → siguiente; hacia la derecha → anterior.
  let inicioX = null;
  escenario.addEventListener("pointerdown", (e) => (inicioX = e.clientX));
  escenario.addEventListener("pointerup", (e) => {
    if (inicioX === null) return;
    const delta = e.clientX - inicioX;
    if (Math.abs(delta) > 50) (delta < 0 ? siguiente : anterior)();
    inicioX = null;
  });

  // [ESTUDIO] Teclado: flechas ← → cambian de slide, solo si el foco está dentro del slider.
  document.addEventListener("keydown", (e) => {
    if (!slider.contains(document.activeElement)) return;
    if (e.key === "ArrowRight") siguiente();
    if (e.key === "ArrowLeft") anterior();
  });

  // [ESTUDIO] Clic en "Ver info": abre la ficha rápida del juego de ese slide.
  escenario.addEventListener("click", (e) => {
    const info = e.target.closest("[data-info]");
    if (info) abrirFicha(destacados.find((j) => String(j.id) === info.dataset.info), info);
  });

  // [ESTUDIO] Estado inicial: se ve el primer slide, su indicador activo y los peeks sin animar.
  slides[0].classList.add("slide--activo");
  marcarIndicador();
  actualizarPeeks(false);

  // El autoplay arranca cuando termina el loading
  return () => reiniciarAutoplay();
}

/* ---------- Filas de carruseles ---------- */

// [ESTUDIO] ARMADO DE LAS FILAS DEL HOME. POR_FILA = juegos por carrusel.
// tieneGenero(...) devuelve una función para filter(). porRating ordena de mayor a menor puntaje (sort).
const POR_FILA = 8;
const tieneGenero = (...generos) => (j) => generos.some((g) => j.generos.includes(g));
const porRating = (a, b) => b.rating - a.rating;
// Mezcla fija (siempre igual) para que "Recomendados" no repita el orden de "Mejores puntuados"
const mezclaFija = (a, b) => ((a.id * 7919) % 97) - ((b.id * 7919) % 97);

// Cada juego aparece en una sola fila, así ninguna imagen se repite en el Home.
// Las categorías chicas eligen primero para que no se queden sin juegos.
// [ESTUDIO] Reparte los juegos en filas SIN REPETIR (el enunciado pide imágenes distintas en cada carrusel).
// new Set() guarda los ids ya usados; tomar() elige los que todavía no se usaron.
// Devuelve un array: cada elemento es un carrusel, la fila de cards grandes o el banner.
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
  // [ESTUDIO] El título de cada fila sale de la misma lista que el menú ☰ (comun.js) → siempre coinciden.
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
// [ESTUDIO] HTML de una card grande: reusa las clases de la card chica (.card, .card__titulo, .card-boton).
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

// Las 3 mejores ofertas; "Ver todos" lleva a la fila "En oferta" con el resto. Misma cabecera que los carruseles, como en el Figma
function crearFilaGrandes({ juegos }) {
  return `
    <section class="seccion-grandes" id="ofertas-destacadas" aria-labelledby="titulo-ofertas-destacadas">
      <div class="carrusel__cabecera">
        <h2 class="titulo-seccion" id="titulo-ofertas-destacadas">Ofertas destacadas</h2>
        <a class="carrusel__ver-todos" href="#ofertas">Ver todos</a>
      </div>
      <div class="fila-grandes">
        ${juegos.map(crearCardGrande).join("")}
      </div>
    </section>`;
}

// Banner a todo el ancho: usa la imagen en alta porque es mucho más grande que una card
// Arte de Steam para el banner: imagen ancha + logo con el nombre del juego (la API solo trae capturas sin texto)
const STEAM = "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";
const ARTE_BANNER = {
  41494: { fondo: `${STEAM}/1091500/library_hero.jpg`, logo: `${STEAM}/1091500/logo.png` }, // Cyberpunk 2077
};

// [ESTUDIO] BANNER: usa el arte de Steam si existe. onerror = si la imagen no carga, pone la de la API
// y saca el logo, así nunca queda un espacio roto.
function crearBanner({ juego }) {
  if (!juego) return "";
  const arte = ARTE_BANNER[juego.id];
  const respaldo = juego.imagenGrande || juego.imagen;
  // Si el arte de Steam no carga, vuelve a la imagen de la API y se saca el logo
  const fondo = arte
    ? `<img src="${arte.fondo}" alt="${juego.nombre}" loading="lazy" onerror="this.onerror=null; this.src='${respaldo}'; this.nextElementSibling?.remove()">
      <img class="banner__logo" src="${arte.logo}" alt="" loading="lazy" onerror="this.remove()">`
    : `<img src="${respaldo}" alt="${juego.nombre}" loading="lazy">`;
  return `
    <section class="banner" aria-label="Próximamente: ${juego.nombre}">
      ${fondo}
      <span class="banner__etiqueta">Próximamente</span>
    </section>`;
}

// [ESTUDIO] Según el tipo de fila, llama a la función que arma su HTML (dos ternarios encadenados).
const crearFila = (fila) =>
  fila.tipo === "grandes" ? crearFilaGrandes(fila) : fila.tipo === "banner" ? crearBanner(fila) : crearCarrusel(fila);

/* ---------- Inicio ---------- */

// [ESTUDIO] *** PUNTO DE ARRANQUE DEL HOME (se llama en la última línea) ***
// 1. iniciarComun(): header, paneles y footer (comun.js).
// 2. Arranca el loading (sin await: corre mientras sigue lo demás).
// 3. await obtenerJuegos(): espera los juegos de la API (datos.js).
// 4. Arma el slider, las filas (armarFilas + crearFila) y conecta los eventos.
// 5. await carga: espera que termine el loading.
// 6. Arranca el autoplay del slider y, si la URL tiene #algo, baja hasta esa sección.
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
