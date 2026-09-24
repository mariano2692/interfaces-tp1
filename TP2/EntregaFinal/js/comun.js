"use strict";

/* =========================================================
   Partes compartidas entre Home y Juego:
   header, menú de categorías, menú de cuenta, carrito,
   footer, cards y carruseles.
   ========================================================= */

const svg = (contenido, extra = "") =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${contenido}</svg>`;

const ICONOS = {
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  cerrar: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  buscar: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  carrito: svg('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>'),
  flecha: svg('<path d="M6 9l6 6 6-6"/>'),
  izquierda: svg('<path d="M15 18l-6-6 6-6"/>'),
  derecha: svg('<path d="M9 18l6-6-6-6"/>'),
  tacho: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>'),
  inicio: svg('<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>'),
  biblioteca: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  perfil: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  joystick: svg('<rect x="2" y="7" width="20" height="12" rx="6"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14" r="1"/>'),
  corazon: svg('<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/>'),
  config: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  salir: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  accion: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  disparos: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
  rpg: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>'),
  aventura: svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
  indie: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>'),
  puzzle: svg('<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4z"/>'),
  estrella: svg('<path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4-5.7-5 7.5-.7z"/>', 'fill="currentColor" stroke="none"'),
  instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
  x: svg('<path d="M4 4l16 16M20 4L4 20"/>'),
  discord: svg('<path d="M8 17c-3 0-5-1-5-1 0-5 1.5-9 3-10.5C7.5 5 9 4.5 9 4.5l.5 1.5h5l.5-1.5s1.5.5 3 1c1.5 1.5 3 5.5 3 10.5 0 0-2 1-5 1l-1-2"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><path d="M8 15.5c2.5 1 5.5 1 8 0"/>'),
  youtube: svg('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>'),
};

const USUARIO = { nick: "Dragonslayer9", inicial: "D" };

const CATEGORIAS_MENU = [
  { nombre: "Acción", ancla: "accion", icono: "accion" },
  { nombre: "Disparos", ancla: "disparos", icono: "disparos" },
  { nombre: "RPG", ancla: "rpg", icono: "rpg" },
  { nombre: "Aventura", ancla: "aventura", icono: "aventura" },
  { nombre: "Indie", ancla: "indie", icono: "indie" },
  { nombre: "Puzzle y plataformas", ancla: "puzzle", icono: "puzzle" },
];

/* ---------- Header ---------- */

function crearHeader() {
  const header = document.getElementById("header");
  header.className = "header";
  header.innerHTML = `
    <button class="header__icono" id="abrir-categorias" aria-label="Abrir menú de categorías" aria-expanded="false" aria-controls="panel-categorias">${ICONOS.menu}</button>
    <a class="logo header__logo" href="home.html">Neo<span>Arcade</span></a>
    <form class="buscador" role="search" onsubmit="return false">
      <span class="buscador__icono">${ICONOS.buscar}</span>
      <input type="search" placeholder="Buscar juegos" aria-label="Buscar juegos">
    </form>
    <div class="header__acciones">
      <button class="header__icono" id="abrir-carrito" aria-label="Abrir carrito">
        ${ICONOS.carrito}
        <span class="contador" id="contador-carrito" hidden>0</span>
      </button>
      <button class="cuenta" id="abrir-cuenta" aria-label="Abrir menú de cuenta" aria-expanded="false" aria-controls="menu-cuenta">
        <span class="avatar">${USUARIO.inicial}</span>
        <span class="cuenta__flecha">${ICONOS.flecha}</span>
      </button>
    </div>`;
}

/* ---------- Paneles: categorías, cuenta y carrito ---------- */

function crearPaneles() {
  const itemsCategorias = CATEGORIAS_MENU.map(
    (c) => `<a class="panel__item" href="home.html#${c.ancla}">${ICONOS[c.icono]} ${c.nombre}</a>`
  ).join("");

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="scrim" id="scrim" hidden></div>

    <nav class="panel panel--izquierda" id="panel-categorias" aria-label="Categorías" hidden>
      <a class="panel__item" href="home.html">${ICONOS.inicio} Inicio</a>
      <a class="panel__item" href="#">${ICONOS.biblioteca} Biblioteca</a>
      <div class="panel__divisor"></div>
      <p class="panel__grupo">Categorías</p>
      ${itemsCategorias}
    </nav>

    <div class="menu-cuenta" id="menu-cuenta" hidden>
      <div class="menu-cuenta__usuario">
        <span class="avatar avatar--grande">${USUARIO.inicial}</span>
        <span class="texto-enfasis">${USUARIO.nick}</span>
      </div>
      <div class="panel__divisor"></div>
      <a class="panel__item" href="#">${ICONOS.perfil} Mi perfil</a>
      <a class="panel__item" href="#">${ICONOS.joystick} Mis juegos</a>
      <a class="panel__item" href="#">${ICONOS.corazon} Favoritos</a>
      <a class="panel__item" href="#">${ICONOS.config} Configuración</a>
      <div class="panel__divisor"></div>
      <a class="panel__item" href="index.html">${ICONOS.salir} Cerrar sesión</a>
    </div>

    <aside class="panel panel--derecha carrito" id="panel-carrito" aria-label="Tu carrito" hidden>
      <div class="carrito__cabecera">
        <h2 class="titulo-seccion">Tu carrito</h2>
        <button class="header__icono" id="cerrar-carrito" aria-label="Cerrar carrito">${ICONOS.cerrar}</button>
      </div>
      <ul class="carrito__lista" id="carrito-lista"></ul>
      <div class="carrito__pie">
        <div class="carrito__total"><span>Total</span><span class="texto-enfasis" id="carrito-total">USD 0,00</span></div>
        <button class="boton boton--primario boton--ancho" id="finalizar-compra">Finalizar compra</button>
      </div>
    </aside>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>`
  );
}

// Solo un panel abierto a la vez; se cierra con el scrim, con Esc o con clic afuera
let panelAbierto = null;

function abrirPanel(id, disparador) {
  cerrarPanel();
  const panel = document.getElementById(id);
  panel.hidden = false;
  panelAbierto = { panel, disparador };
  disparador?.setAttribute("aria-expanded", "true");
  if (panel.classList.contains("panel")) document.getElementById("scrim").hidden = false;
}

function cerrarPanel() {
  if (!panelAbierto) return;
  panelAbierto.panel.hidden = true;
  panelAbierto.disparador?.setAttribute("aria-expanded", "false");
  document.getElementById("scrim").hidden = true;
  panelAbierto = null;
}

function conectarPaneles() {
  const alternar = (id, boton) => () =>
    panelAbierto?.panel.id === id ? cerrarPanel() : abrirPanel(id, boton);

  const btnCategorias = document.getElementById("abrir-categorias");
  const btnCuenta = document.getElementById("abrir-cuenta");
  const btnCarrito = document.getElementById("abrir-carrito");

  btnCategorias.addEventListener("click", alternar("panel-categorias", btnCategorias));
  btnCuenta.addEventListener("click", alternar("menu-cuenta", btnCuenta));
  btnCarrito.addEventListener("click", alternar("panel-carrito", btnCarrito));
  document.getElementById("cerrar-carrito").addEventListener("click", cerrarPanel);
  document.getElementById("scrim").addEventListener("click", cerrarPanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarPanel();
  });

  // El menú de cuenta no tiene scrim: se cierra al hacer clic afuera
  document.addEventListener("click", (e) => {
    if (panelAbierto?.panel.id !== "menu-cuenta") return;
    if (!panelAbierto.panel.contains(e.target) && !btnCuenta.contains(e.target)) cerrarPanel();
  });

  // Los links a categorías cierran el panel al navegar dentro del Home
  document.querySelectorAll("#panel-categorias a").forEach((a) => a.addEventListener("click", cerrarPanel));
}

/* ---------- Toast ---------- */

let temporizadorToast;

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.remove("toast--visible");
  void toast.offsetWidth;
  toast.classList.add("toast--visible");
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => toast.classList.remove("toast--visible"), 2600);
}

/* ---------- Carrito (se guarda en el navegador para compartirlo entre páginas) ---------- */

const CLAVE_CARRITO = "neoarcade-carrito";
let carrito = [];

function leerCarrito() {
  try {
    carrito = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
  } catch {
    carrito = [];
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch {
    /* sin almacenamiento: el carrito vive solo en esta página */
  }
}

function agregarAlCarrito(juego) {
  if (carrito.some((item) => item.id === juego.id)) {
    mostrarToast(`${juego.nombre} ya está en tu carrito`);
    return;
  }
  carrito.push({ id: juego.id, nombre: juego.nombre, imagen: juego.imagen, precio: juego.precio.final });
  guardarCarrito();
  renderizarCarrito(true);
  mostrarToast(`Agregaste ${juego.nombre} al carrito`);
}

function renderizarCarrito(animar = false) {
  const lista = document.getElementById("carrito-lista");
  const contador = document.getElementById("contador-carrito");
  const total = carrito.reduce((suma, item) => suma + item.precio, 0);

  lista.innerHTML = carrito.length
    ? carrito
        .map(
          (item) => `
      <li class="carrito__item">
        <img src="${item.imagen}" alt="" loading="lazy">
        <div class="carrito__datos">
          <span class="carrito__nombre">${item.nombre}</span>
          <span class="texto-enfasis">${formatearPrecio(item.precio)}</span>
        </div>
        <button class="header__icono carrito__quitar" data-quitar="${item.id}" aria-label="Quitar ${item.nombre}">${ICONOS.tacho}</button>
      </li>`
        )
        .join("")
    : `<li class="carrito__vacio">Tu carrito está vacío. Tocá <b>Comprar</b> en cualquier juego para sumarlo.</li>`;

  document.getElementById("carrito-total").textContent = formatearPrecio(total);
  document.getElementById("finalizar-compra").disabled = carrito.length === 0;

  contador.hidden = carrito.length === 0;
  contador.textContent = carrito.length;
  if (animar) {
    contador.classList.remove("contador--latido");
    void contador.offsetWidth;
    contador.classList.add("contador--latido");
  }
}

function conectarCarrito() {
  leerCarrito();
  renderizarCarrito();

  document.getElementById("carrito-lista").addEventListener("click", (e) => {
    const boton = e.target.closest("[data-quitar]");
    if (!boton) return;
    carrito = carrito.filter((item) => String(item.id) !== boton.dataset.quitar);
    guardarCarrito();
    renderizarCarrito();
  });

  document.getElementById("finalizar-compra").addEventListener("click", () => {
    const cantidad = carrito.length;
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
    cerrarPanel();
    mostrarToast(`¡Compra realizada! ${cantidad === 1 ? "El juego ya está" : "Los juegos ya están"} en tu biblioteca`);
  });
}

/* ---------- Footer ---------- */

const PAGOS = [
  ["Visa", '<svg viewBox="0 0 40 24"><text x="20" y="16.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-style="italic" font-size="11" fill="#1A1F71">VISA</text></svg>'],
  ["Mastercard", '<svg viewBox="0 0 40 24"><circle cx="16" cy="12" r="7" fill="#EB001B"/><circle cx="24" cy="12" r="7" fill="#F79E1B" fill-opacity=".9"/></svg>'],
  ["Bitcoin", '<svg viewBox="0 0 40 24"><circle cx="20" cy="12" r="9" fill="#F7931A"/><text x="20" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="#FFF">₿</text></svg>'],
  ["Ethereum", '<svg viewBox="0 0 40 24"><circle cx="20" cy="12" r="9" fill="#8A92B2"/><path d="M20 5l-4.5 7.3L20 15l4.5-2.7z" fill="#FFF"/><path d="M20 16l-4.5-2.7L20 19l4.5-5.7z" fill="#E0E3F0"/></svg>'],
  ["Bitcoin Cash", '<svg viewBox="0 0 40 24"><circle cx="20" cy="12" r="9" fill="#0AC18E"/><text x="20" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="#0E0B16">₿</text></svg>'],
  ["Google Pay", '<svg viewBox="0 0 40 24"><path d="M28 12.2c0-.6 0-1.1-.1-1.6H20v3.1h4.5a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.6 2.5-6.1z" fill="#4285F4"/><path d="M20 20c2.3 0 4.2-.8 5.5-2.1l-2.7-2.1c-.7.5-1.7.8-2.8.8-2.2 0-4-1.5-4.7-3.4h-2.8v2.2A8 8 0 0 0 20 20z" fill="#34A853"/><path d="M15.3 13.2a4.8 4.8 0 0 1 0-3.1V7.9h-2.8a8 8 0 0 0 0 7.2z" fill="#FBBC05"/><path d="M20 7.2c1.2 0 2.3.4 3.2 1.2l2.4-2.4A8 8 0 0 0 12.5 7.9l2.8 2.2c.7-2 2.5-2.9 4.7-2.9z" fill="#EA4335"/></svg>'],
  ["Amazon Pay", '<svg viewBox="0 0 40 24"><text x="20" y="14" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#EDECF5">a</text><path d="M13 16c4 2.5 10 2.5 14 0" fill="none" stroke="#FF9900" stroke-width="1.6" stroke-linecap="round"/><path d="M25.5 14.8l1.8 1.1-1.2 1.7" fill="none" stroke="#FF9900" stroke-width="1.4" stroke-linecap="round"/></svg>'],
];

const TIENDAS = [
  ["App Store", '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9A4.9 4.9 0 0 0 3.7 9.4c-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.3.8 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.3 4.3 0 0 1-2.5-4.3zM13.9 5.2A4.3 4.3 0 0 0 15 2a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3.1 3.6 3.6 0 0 0 2.8-1.4z"/></svg>'],
  ["Google Play", '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 3l10 9-10 9z"/><path d="M4 3l13 7.5-3 1.5M4 21l13-7.5-3-1.5M17 10.5l3 1.5-3 1.5"/></svg>'],
];

function crearFooter() {
  const footer = document.getElementById("footer");
  footer.className = "footer";
  const columna = (titulo, links) => `
    <nav class="footer__columna" aria-label="${titulo}">
      <p class="footer__titulo">${titulo}</p>
      ${links.map(([texto, href = "#"]) => `<a href="${href}">${texto}</a>`).join("")}
    </nav>`;

  footer.innerHTML = `
    <div class="footer__bloque footer__principal">
      ${columna("Categorías", [
        ["Todos los juegos", "home.html"], ["Más vendidos"], ["Mejor puntuados", "home.html#mas-jugados"],
        ["Últimos lanzamientos"], ["Próximamente"], ["Free to play"], ["Ofertas especiales"],
        ["Exclusivos de la plataforma"], ["Basados en tus gustos"], ["Multijugador"],
        ["Recomendado para vos", "home.html#recomendados"], ["Single player"], ["Multi player"],
      ])}
      ${columna("Información", [
        ["Acerca de nosotros"], ["Comunidad"], ["Foro"], ["Cupones de descuento"], ["Trabajá con nosotros"], ["Centro de ayuda"],
      ])}
      ${columna("Géneros", [
        ["Acción", "home.html#accion"], ["Aventura", "home.html#aventura"], ["Rol RPG", "home.html#rpg"], ["Estrategia"],
        ["Simulación"], ["Deportes"], ["Carreras"], ["Pelea"], ["Terror"], ["Battle royale"],
        ["Shooter", "home.html#disparos"], ["Ver todos", "home.html"],
      ])}
      <div class="footer__lateral">
        <form class="newsletter" id="newsletter" novalidate>
          <label class="footer__subtitulo" for="newsletter-mail">Suscribite a nuestro newsletter</label>
          <div class="newsletter__fila">
            <input type="email" id="newsletter-mail" placeholder="tunombre@mail.com" autocomplete="email">
            <button class="newsletter__boton" type="submit">Suscribirse</button>
          </div>
          <p class="newsletter__error" role="alert" hidden>ⓘ Ingresá un correo electrónico válido</p>
        </form>

        <div>
          <p class="footer__subtitulo">Descargá nuestra app</p>
          <div class="tiendas">
            ${TIENDAS.map(([nombre, icono]) => `<a class="tienda" href="#">${icono}<span>${nombre}</span></a>`).join("")}
          </div>
        </div>

        <div>
          <p class="footer__subtitulo">Contactate con nosotros</p>
          <div class="footer__redes">
            <a href="#" aria-label="Instagram">${ICONOS.instagram}</a>
            <a href="#" aria-label="X">${ICONOS.x}</a>
            <a href="#" aria-label="Discord">${ICONOS.discord}</a>
            <a href="#" aria-label="YouTube">${ICONOS.youtube}</a>
          </div>
        </div>
      </div>
    </div>

    <div class="footer__bloque footer__pagos">
      <p class="footer__subtitulo">Métodos de pago</p>
      <ul class="pagos">
        ${PAGOS.map(([nombre, logo]) => `<li class="pago" title="${nombre}" aria-label="${nombre}">${logo}</li>`).join("")}
      </ul>
      <a class="logo footer__logo" href="home.html">Neo<span>Arcade</span></a>
    </div>

    <div class="footer__bloque footer__legales">
      <p>© 2026 NeoArcade. Todos los derechos reservados.</p>
      <nav class="footer__links-legales" aria-label="Legales">
        <a href="#">Términos y condiciones</a>
        <a href="#">Política de privacidad</a>
        <a href="#">Política de cookies</a>
        <a href="#">Accesibilidad</a>
      </nav>
    </div>`;

  conectarNewsletter();
}

function conectarNewsletter() {
  const form = document.getElementById("newsletter");
  const input = document.getElementById("newsletter-mail");
  const error = form.querySelector(".newsletter__error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    error.hidden = valido;
    form.classList.toggle("newsletter--error", !valido);
    if (!valido) return;
    form.reset();
    mostrarToast("¡Listo! Te vamos a avisar de las novedades");
  });
}

/* ---------- Card de juego ---------- */

function crearCard(juego) {
  const { precio } = juego;
  const esNuevo = juego.anio >= 2019;

  let precioHtml = `<span class="precio precio--gratis">Gratis</span>`;
  if (!precio.gratis) {
    precioHtml = precio.descuento
      ? `<span class="precio"><s>${formatearPrecio(precio.lista)}</s>${formatearPrecio(precio.final)}</span>`
      : `<span class="precio">${formatearPrecio(precio.final)}</span>`;
  }

  const boton = precio.gratis
    ? `<button class="card-boton card-boton--jugar" data-jugar="${juego.id}">Jugar</button>`
    : `<button class="card-boton card-boton--comprar" data-comprar="${juego.id}">Comprar</button>`;

  let badge = "";
  if (precio.descuento) badge = `<span class="badge badge--oferta">-${precio.descuento}%</span>`;
  else if (esNuevo) badge = `<span class="badge">Nuevo</span>`;

  const imagen = `<img src="${juego.imagen}" alt="${juego.nombre}" loading="lazy">${badge}`;

  return `
    <article class="card">
      ${juego.url
        ? `<a class="card__imagen" href="${juego.url}">${imagen}</a>`
        : `<div class="card__imagen">${imagen}</div>`}
      <div class="card__contenido">
        <h3 class="card__titulo" title="${juego.nombre}">${juego.nombre}</h3>
        <div class="card__meta">${precioHtml}${boton}</div>
      </div>
    </article>`;
}

/* ---------- Carrusel de cards ---------- */

function crearCarrusel({ titulo, ancla, juegos }) {
  return `
    <section class="carrusel" id="${ancla}" aria-labelledby="titulo-${ancla}">
      <div class="carrusel__cabecera">
        <h2 class="titulo-seccion" id="titulo-${ancla}">${titulo}</h2>
        <a class="carrusel__ver-todos" href="#${ancla}">Ver todos</a>
      </div>
      <div class="carrusel__cuerpo">
        <button class="carrusel__flecha carrusel__flecha--izq" aria-label="Anteriores" disabled>${ICONOS.izquierda}</button>
        <div class="carrusel__pista">${juegos.map(crearCard).join("")}</div>
        <button class="carrusel__flecha carrusel__flecha--der" aria-label="Siguientes">${ICONOS.derecha}</button>
      </div>
    </section>`;
}

// Además del desplazamiento, las cards que quedan a la vista entran escalonadas
// desde el lado hacia el que se avanza
function animarEntrada(pista, destino, sentido) {
  const visibles = [...pista.children].filter(
    (card) => card.offsetLeft + card.offsetWidth > destino && card.offsetLeft < destino + pista.clientWidth
  );
  const clase = sentido > 0 ? "card--entra-der" : "card--entra-izq";
  const orden = sentido > 0 ? visibles : visibles.reverse();

  orden.forEach((card, i) => {
    card.classList.remove("card--entra-der", "card--entra-izq");
    void card.offsetWidth; // reinicia la animación si se hace clic seguido
    card.style.animationDelay = `${i * 70}ms`;
    card.classList.add(clase);
    card.addEventListener(
      "animationend",
      () => {
        card.classList.remove(clase);
        card.style.animationDelay = "";
      },
      { once: true }
    );
  });
}

function conectarCarruseles(contenedor) {
  contenedor.querySelectorAll(".carrusel").forEach((carrusel) => {
    const pista = carrusel.querySelector(".carrusel__pista");
    const izq = carrusel.querySelector(".carrusel__flecha--izq");
    const der = carrusel.querySelector(".carrusel__flecha--der");

    const actualizar = () => {
      izq.disabled = pista.scrollLeft <= 4;
      der.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
    };
    const mover = (sentido) => {
      const maximo = pista.scrollWidth - pista.clientWidth;
      const destino = Math.max(0, Math.min(pista.scrollLeft + sentido * pista.clientWidth * 0.9, maximo));
      pista.scrollTo({ left: destino, behavior: "smooth" });
      animarEntrada(pista, destino, sentido);
    };

    izq.addEventListener("click", () => mover(-1));
    der.addEventListener("click", () => mover(1));
    pista.addEventListener("scroll", actualizar, { passive: true });
    actualizar();
  });
}

// Comprar / Jugar desde cualquier card de la página
function conectarBotonesDeCards(juegos) {
  const porId = new Map(juegos.map((j) => [String(j.id), j]));
  document.addEventListener("click", (e) => {
    const comprar = e.target.closest("[data-comprar]");
    const jugar = e.target.closest("[data-jugar]");
    if (comprar) agregarAlCarrito(porId.get(comprar.dataset.comprar));
    if (jugar) {
      const juego = porId.get(jugar.dataset.jugar);
      if (juego.url) window.location.href = juego.url;
      else mostrarToast(`${juego.nombre} se agregó a tu biblioteca`);
    }
  });
}

/* ---------- Inicio común ---------- */

function iniciarComun() {
  crearHeader();
  crearPaneles();
  crearFooter();
  conectarPaneles();
  conectarCarrito();
}
