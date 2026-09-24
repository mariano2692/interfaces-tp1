"use strict";

const recuadro = document.getElementById("recuadro");
const tabs = document.querySelectorAll(".tab");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const exito = document.getElementById("exito");

const DESTINO = "home.html";
const DEMORA_REDIRECCION = 2200;
const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Tabs: Crear cuenta <-> Iniciar sesión ---------- */

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

function marcarError(input, hayError) {
  input.closest(".campo").classList.toggle("campo--error", hayError);
  input.setAttribute("aria-invalid", hayError);
  return !hayError;
}

// Cada regla devuelve true si el valor es válido
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

function validarCampo(input) {
  const regla = reglas[input.id];
  return regla ? marcarError(input, !regla(input.value, input)) : true;
}

function validarFormulario(form) {
  const inputs = form.querySelectorAll("input");
  let valido = true;
  inputs.forEach((input) => {
    if (!validarCampo(input)) valido = false;
  });
  return valido;
}

// Una vez que el campo mostró error, se revalida mientras el usuario escribe
document.querySelectorAll(".formulario input").forEach((input) => {
  const evento = input.type === "checkbox" ? "change" : "input";
  input.addEventListener(evento, () => {
    if (input.closest(".campo--error")) validarCampo(input);
  });
});

function sacudir() {
  recuadro.classList.remove("recuadro--sacudir");
  void recuadro.offsetWidth; // reinicia la animación si se repite
  recuadro.classList.add("recuadro--sacudir");
}

/* ---------- Envío correcto ---------- */

function mostrarExito(titulo, texto) {
  document.getElementById("exito-titulo").textContent = titulo;
  document.getElementById("exito-texto").textContent = texto;
  exito.hidden = false;
  setTimeout(() => {
    window.location.href = DESTINO;
  }, DEMORA_REDIRECCION);
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validarFormulario(formLogin)) {
    sacudir();
    formLogin.querySelector(".campo--error input").focus();
    return;
  }
  mostrarExito("¡Hola de nuevo!", "Te estamos llevando a NeoArcade…");
});

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
document.querySelectorAll("[data-social]").forEach((boton) => {
  boton.addEventListener("click", () => {
    mostrarExito("¡Hola de nuevo!", "Te estamos llevando a NeoArcade…");
  });
});
