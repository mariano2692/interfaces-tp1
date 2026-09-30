// [ESTUDIO] QUÉ ES ESTE ARCHIVO: la lógica de index.html (Login y Registro): pestañas, mostrar contraseña,
// validación de los campos, animación de error y pantalla de éxito.
// No carga comun.js porque el login no tiene header, carrito ni footer.
"use strict";

// [ESTUDIO] Busca en el HTML los elementos que va a usar. querySelectorAll devuelve TODOS los que coinciden.
const recuadro = document.getElementById("recuadro");
const tabs = document.querySelectorAll(".tab");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const exito = document.getElementById("exito");

const DESTINO = "home.html";
const DEMORA_REDIRECCION = 2200;
// [ESTUDIO] Expresión regular del correo: algo sin espacios, una @, algo, un punto y algo (ej: a@b.com).
const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Tabs: Crear cuenta <-> Iniciar sesión ---------- */

// [ESTUDIO] PESTAÑAS: recorre las dos. A la tocada le pone .tab--activa (el CSS hace crecer el subrayado)
// y muestra su formulario; al otro formulario le pone hidden. aria-controls dice qué formulario
// corresponde a cada pestaña. También cambia el título de la pestaña del navegador.
function activarTab(tab) {
  tabs.forEach((t) => {
    const activa = t === tab;
    t.classList.toggle("tab--activa", activa);
    t.setAttribute("aria-selected", activa);
    document.getElementById(t.getAttribute("aria-controls")).hidden = !activa;
  });
  document.title = `${tab.textContent} — NeoArcade`;
}

tabs.forEach((tab) => tab.addEventListener("click", () => activarTab(tab)));

/* ---------- Mostrar / ocultar contraseña ---------- */

// [ESTUDIO] OJO DE LA CONTRASEÑA: cambia el input de type="password" (puntitos) a type="text" y al revés.
// previousElementSibling = el elemento que está justo antes del botón (el input).
document.querySelectorAll(".campo__ojo").forEach((ojo) => {
  ojo.addEventListener("click", () => {
    const input = ojo.previousElementSibling;
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    ojo.setAttribute("aria-pressed", mostrar);
    ojo.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
  });
});

/* ---------- Validación ---------- */

// [ESTUDIO] Marca o desmarca el error de un campo: closest(".campo") sube hasta el contenedor del campo
// y le pone o saca .campo--error (el CSS pinta el borde rojo y muestra el mensaje).
function marcarError(input, hayError) {
  input.closest(".campo").classList.toggle("campo--error", hayError);
  input.setAttribute("aria-invalid", hayError);
  return !hayError;
}

// Cada regla devuelve true si el valor es válido
// [ESTUDIO] REGLAS DE VALIDACIÓN: un objeto donde la clave es el id del input y el valor es una función
// que devuelve true si está bien. Ej: "reg-edad" → número entre 1 y 120.
// PARA AGREGAR UNA REGLA: agregar una línea "id-del-input": (v) => condición,
const reglas = {
  "login-mail": (v) => REGEX_MAIL.test(v),
  "login-pass": (v) => v.length >= 8,
  "reg-nombre": (v) => v.trim().split(/\s+/).length >= 2,
  "reg-edad": (v) => Number(v) >= 1 && Number(v) <= 120,
  "reg-mail": (v) => REGEX_MAIL.test(v),
  "reg-pass": (v) => v.length >= 8,
  "reg-pass2": (v) => v.length > 0 && v === document.getElementById("reg-pass").value,
  "reg-captcha": (_, input) => input.checked,
};

// [ESTUDIO] Busca la regla del campo por su id y la ejecuta. Si no tiene regla (nickname), es válido.
function validarCampo(input) {
  const regla = reglas[input.id];
  return regla ? marcarError(input, !regla(input.value, input)) : true;
}

// [ESTUDIO] Valida TODOS los campos del formulario (no se corta en el primero, así se marcan todos los errores).
function validarFormulario(form) {
  const inputs = form.querySelectorAll("input");
  let valido = true;
  inputs.forEach((input) => {
    if (!validarCampo(input)) valido = false;
  });
  return valido;
}

// Una vez que el campo mostró error, se revalida mientras el usuario escribe
// [ESTUDIO] Si un campo ya mostró error, se vuelve a validar mientras escribís: el error se va apenas lo corregís.
document.querySelectorAll(".formulario input").forEach((input) => {
  const evento = input.type === "checkbox" ? "change" : "input";
  input.addEventListener(evento, () => {
    if (input.closest(".campo--error")) validarCampo(input);
  });
});

// [ESTUDIO] Pone la clase del sacudón. Saca y vuelve a poner la clase con void offsetWidth en el medio
// para que la animación se repita si enviás con error varias veces.
function sacudir() {
  recuadro.classList.remove("recuadro--sacudir");
  void recuadro.offsetWidth; // reinicia la animación si se repite
  recuadro.classList.add("recuadro--sacudir");
}

/* ---------- Envío correcto ---------- */

// [ESTUDIO] Muestra la pantalla de éxito (le saca hidden: arrancan sus animaciones de CSS)
// y setTimeout espera 2,2 s (DEMORA_REDIRECCION) antes de ir al Home.
function mostrarExito(titulo, texto) {
  document.getElementById("exito-titulo").textContent = titulo;
  document.getElementById("exito-texto").textContent = texto;
  exito.hidden = false;
  setTimeout(() => {
    window.location.href = DESTINO;
  }, DEMORA_REDIRECCION);
}

// [ESTUDIO] ENVÍO DEL LOGIN. "submit" = cuando se envía el formulario (botón o Enter).
// preventDefault() evita que el navegador recargue la página.
// Si hay errores: sacude, pone el foco en el primer campo con error y corta (return).
// Si está todo bien: pantalla de éxito.
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validarFormulario(formLogin)) {
    sacudir();
    formLogin.querySelector(".campo--error input").focus();
    return;
  }
  mostrarExito("¡Hola de nuevo!", "Te estamos llevando a NeoArcade…");
});

// [ESTUDIO] ENVÍO DEL REGISTRO: igual que el login, pero el saludo usa el nickname o, si no hay,
// el primer nombre (split(" ")[0] = la primera palabra).
formRegistro.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validarFormulario(formRegistro)) {
    sacudir();
    formRegistro.querySelector(".campo--error input").focus();
    return;
  }
  const nick = document.getElementById("reg-nick").value.trim();
  const nombre = nick || document.getElementById("reg-nombre").value.trim().split(" ")[0];
  mostrarExito(`¡Cuenta creada, ${nombre}!`, "Te estamos llevando a NeoArcade…");
});

// Google y Facebook no son funcionales: simulan un ingreso correcto
// [ESTUDIO] Google y Facebook no son funcionales (lo permite el enunciado): simulan un ingreso correcto.
document.querySelectorAll("[data-social]").forEach((boton) => {
  boton.addEventListener("click", () => {
    mostrarExito("¡Hola de nuevo!", "Te estamos llevando a NeoArcade…");
  });
});
