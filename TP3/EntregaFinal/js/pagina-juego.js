"use strict";

/* =========================================================
   Partes comunes de las páginas de juego (Peg Solitaire y Blocka):
   botón Compartir, trailer y reseñas de la Comunidad
   ========================================================= */

/* ---------- Compartir ---------- */

// "texto" es lo que se comparte junto con el enlace (cambia según el juego)
function iniciarCompartir(texto) {
  const boton = document.getElementById("abrir-compartir");
  const popover = document.getElementById("popover-compartir");
  const url = encodeURIComponent(location.href);

  document.getElementById("compartir-whatsapp").href = `https://wa.me/?text=${encodeURIComponent(texto)}%20${url}`;
  document.getElementById("compartir-email").href = `mailto:?subject=${encodeURIComponent(texto)}&body=${url}`;
  document.getElementById("compartir-x").href = `https://x.com/intent/post?text=${encodeURIComponent(texto)}&url=${url}`;
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

// "comentarios" son las reseñas de ejemplo que trae cada juego
function iniciarComunidad(comentarios) {
  const lista = document.getElementById("comentarios");
  const form = document.getElementById("form-resena");
  const estrellas = [...document.querySelectorAll("#estrellas button")];
  const textarea = document.getElementById("resena-texto");
  let puntaje = 0;

  comentarios.forEach((c) => lista.appendChild(crearComentario(c)));

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
