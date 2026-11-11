"use strict";

/* =========================================================
   Página de juego — Blocka: Pixel Puzzle (TPE3)

   Una imagen se corta en piezas cuadradas y cada pieza empieza girada.
   Clic izquierdo gira la pieza 90° a la izquierda; clic derecho, 90° a la derecha.
   Cuando todas quedan derechas, el nivel se gana y se quitan los filtros.

   Mapa del archivo:
   1. Datos: banco de imágenes, niveles y grillas
   2. Utilidades: cargar imagen, crear canvas, formatear tiempo, récords
   3. Juego (iniciarBlocka): estado, setup del nivel, dibujo, giro,
      reloj, ayudita, sorteo, ganar/perder y pantallas
   4. Instrucciones, comunidad e inicio de la página
   ========================================================= */

/* ---------- 1. Datos ---------- */

// Banco de imágenes (el enunciado pide 6 o más). Son locales, del mismo sitio:
// si vinieran de otro dominio, getImageData tiraría error (el canvas queda "contaminado").
const IMAGENES = [
  { archivo: "img/blocka/hollow-knight.jpg", nombre: "Hollow Knight" },
  { archivo: "img/blocka/stardew-valley.jpg", nombre: "Stardew Valley" },
  { archivo: "img/blocka/cyberpunk-2077.jpg", nombre: "Cyberpunk 2077" },
  { archivo: "img/blocka/terraria.jpg", nombre: "Terraria" },
  { archivo: "img/blocka/rocket-league.jpg", nombre: "Rocket League" },
  { archivo: "img/blocka/horizon-zero-dawn.jpg", nombre: "Horizon Zero Dawn" },
  { archivo: "img/blocka/portal-2.jpg", nombre: "Portal 2" },
  { archivo: "img/blocka/life-is-strange.jpg", nombre: "Life is Strange" },
];

// Cada nivel dice qué filtros usa (nombres de FILTROS, en filtros.js) y si tiene tiempo máximo.
// Con un solo filtro, todas las piezas lo comparten; con varios, cada pieza recibe uno distinto.
const NIVELES = [
  { filtros: ["grises"] },
  { filtros: ["brillo"] },
  { filtros: ["negativo"], tiempoMaximo: 120 },
  { filtros: ["grises", "brillo", "negativo"], tiempoMaximo: 90 },
];

// Cuántas columnas y filas de piezas según la cantidad elegida.
// Las piezas tienen que ser CUADRADAS: si no, al girarlas 90° no entrarían en su lugar.
const GRILLAS = {
  4: { columnas: 2, filas: 2 },
  6: { columnas: 3, filas: 2 },
  8: { columnas: 4, filas: 2 },
};

// Tamaño máximo del canvas en píxeles reales (el CSS lo achica en pantallas chicas)
const ANCHO_MAXIMO = 720;
const ALTO_MAXIMO = 480;

const DURACION_GIRO = 250; // ms que tarda una pieza en girar 90°
const DURACION_REVELADO = 700; // ms del fundido de la imagen filtrada a la original
const SEGUNDOS_AYUDITA = 5;

// Colores del Design System (base.css) para dibujar en el canvas,
// que no puede leer las variables CSS directamente
const COLOR_SEPARACION = "#0E0B16"; // --fondo
const COLOR_SOBRE = "#16E0F2"; // --secundario
const COLOR_FIJA = "#FFD23F"; // --acento

/* ---------- 2. Utilidades ---------- */

// Cargar una imagen es ASINCRÓNICO: src dispara la descarga y el código sigue.
// La imagen recién se puede dibujar en onload. Envolverlo en una Promise
// permite escribir "const imagen = await cargarImagen(...)" y esperar ahí.
function cargarImagen(src) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error(`No se pudo cargar ${src}`));
    imagen.src = src;
  });
}

// Un canvas que no está en la página (fuera de pantalla), con un ImageData adentro.
// Sirve para después dibujarlo girado con drawImage (putImageData no respeta rotate).
function canvasDesde(imageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  return canvas;
}

// 75 → "01:15"
function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

// Ángulo equivalente entre 0 y 359 (-90 → 270, 450 → 90). Una pieza está derecha si da 0.
const normalizar360 = (angulo) => ((angulo % 360) + 360) % 360;

// Número entero al azar entre 0 y max - 1
const azar = (max) => Math.floor(Math.random() * max);

// Récords en localStorage: uno por nivel y por cantidad de piezas.
// try/catch porque en modo incógnito o con el almacenamiento bloqueado puede fallar.
const claveRecord = (nivel, piezas) => `blocka-record-${nivel}-${piezas}`;

// Récord guardado (en segundos) de ese nivel con esa cantidad de piezas, o null si no hay
function leerRecord(nivel, piezas) {
  try {
    const valor = localStorage.getItem(claveRecord(nivel, piezas));
    return valor === null ? null : Number(valor);
  } catch {
    return null;
  }
}

// Guarda el nuevo récord de ese nivel y cantidad de piezas
function guardarRecord(nivel, piezas, segundos) {
  try {
    localStorage.setItem(claveRecord(nivel, piezas), segundos);
  } catch {
    // sin almacenamiento el récord dura solo esta partida
  }
}

/* ---------- 3. Juego ---------- */

function iniciarBlocka() {
  const lienzo = document.getElementById("lienzo");
  const ctx = lienzo.getContext("2d");
  const contenedor = document.getElementById("blocka");
  const hudNivel = document.getElementById("hud-nivel");
  const hudReloj = document.getElementById("hud-reloj");
  const botonAyudita = document.getElementById("ayudita");
  const botonMenu = document.getElementById("volver-menu");
  const pantallas = {
    menu: document.getElementById("pantalla-menu"),
    sorteo: document.getElementById("pantalla-sorteo"),
    fin: document.getElementById("pantalla-fin"),
  };

  // Estado del juego
  let nivel = 0; // índice en NIVELES
  let cantidadPiezas = 4;
  let lado = 0; // lado de cada pieza en píxeles
  let piezas = [];
  let estado = "menu"; // "menu" | "sorteo" | "jugando" | "ganado" | "perdido"
  let segundos = 0;
  let reloj = null;
  let piezaSobre = -1; // índice de la pieza bajo el mouse (-1 = ninguna)
  let resuelta = false; // true → se dibujan las piezas originales (sin filtro)
  let opacidadOriginal = 0; // 0 a 1 durante el fundido del revelado
  const usadas = new Set(); // imágenes que ya salieron, para no repetir hasta usarlas todas

  /* --- Setup del nivel: cortar la imagen y aplicar los filtros --- */

  // Los filtros se aplican UNA vez acá, en el setup del nivel (lo pide el enunciado),
  // y no en cada dibujo: cada pieza guarda su versión original y su versión filtrada.
  function armarNivel(imagen) {
    const { columnas, filas } = GRILLAS[cantidadPiezas];
    lado = Math.floor(Math.min(ANCHO_MAXIMO / columnas, ALTO_MAXIMO / filas));
    lienzo.width = columnas * lado;
    lienzo.height = filas * lado;

    // 1) La imagen completa en un canvas fuera de pantalla, recortada para llenarlo
    //    sin deformarse (como object-fit: cover): se toma la parte central.
    const fuente = document.createElement("canvas");
    fuente.width = lienzo.width;
    fuente.height = lienzo.height;
    const ctxFuente = fuente.getContext("2d");
    const escala = Math.max(fuente.width / imagen.width, fuente.height / imagen.height);
    const anchoRecorte = fuente.width / escala;
    const altoRecorte = fuente.height / escala;
    ctxFuente.drawImage(
      imagen,
      (imagen.width - anchoRecorte) / 2, (imagen.height - altoRecorte) / 2, anchoRecorte, altoRecorte,
      0, 0, fuente.width, fuente.height
    );

    // 2) Cada pieza: su cuadrado de píxeles (getImageData), una copia con el filtro
    //    del nivel, y un giro inicial al azar (90, 180 o 270: nunca empieza derecha).
    const { filtros } = NIVELES[nivel];
    piezas = [];
    for (let fila = 0; fila < filas; fila++) {
      for (let columna = 0; columna < columnas; columna++) {
        const original = ctxFuente.getImageData(columna * lado, fila * lado, lado, lado);
        // Copia del arreglo de bytes: si filtrara "original" directamente, perdería la imagen sin filtro
        const filtrada = new ImageData(new Uint8ClampedArray(original.data), lado, lado);
        const nombreFiltro = filtros[piezas.length % filtros.length];
        FILTROS[nombreFiltro].aplicar(filtrada);

        const angulo = (1 + azar(3)) * 90;
        piezas.push({
          columna,
          fila,
          angulo, // hacia dónde tiene que quedar (múltiplo de 90)
          anguloVisible: angulo, // cómo se dibuja ahora (cambia de a poco mientras gira)
          fija: false, // true si la acomodó la ayudita: ya no se puede girar
          animacion: null,
          original: canvasDesde(original),
          filtrada: canvasDesde(filtrada),
        });
      }
    }
    resuelta = false;
    opacidadOriginal = 0;
    piezaSobre = -1;
  }

  /* --- Dibujo --- */

  // Dibuja todas las piezas. Para girar una pieza sobre SU centro:
  // save → translate al centro de la pieza → rotate → drawImage centrado → restore.
  // (rotate siempre gira alrededor del (0, 0), por eso primero se mueve el origen.)
  function dibujar() {
    ctx.fillStyle = COLOR_SEPARACION;
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);

    piezas.forEach((pieza, i) => {
      const centroX = pieza.columna * lado + lado / 2;
      const centroY = pieza.fila * lado + lado / 2;

      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate((pieza.anguloVisible * Math.PI) / 180); // rotate usa radianes
      ctx.drawImage(pieza.filtrada, -lado / 2, -lado / 2);
      // Revelado: la original se dibuja encima con opacidad creciente (fundido)
      if (resuelta) {
        ctx.globalAlpha = opacidadOriginal;
        ctx.drawImage(pieza.original, -lado / 2, -lado / 2);
      }
      ctx.restore();

      // Bordes: separación entre piezas, la del mouse en cyan y las fijas en amarillo
      if (resuelta) return;
      const x = pieza.columna * lado;
      const y = pieza.fila * lado;
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLOR_SEPARACION;
      ctx.strokeRect(x + 1, y + 1, lado - 2, lado - 2);
      if (pieza.fija || i === piezaSobre) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = pieza.fija ? COLOR_FIJA : COLOR_SOBRE;
        ctx.strokeRect(x + 3, y + 3, lado - 6, lado - 6);
      }
    });
  }

  /* --- Girar piezas --- */

  const estaDerecha = (pieza) => normalizar360(pieza.angulo) === 0;

  // Anima anguloVisible desde donde está hasta pieza.angulo con requestAnimationFrame:
  // el navegador llama a "cuadro" antes de cada repintado (~60 veces por segundo).
  // Es la misma interpolación de los degradés de las filminas: a + (b − a) * t, con t de 0 a 1.
  function animarGiro(pieza) {
    cancelAnimationFrame(pieza.animacion); // si ya estaba girando, sigue desde donde quedó
    const desde = pieza.anguloVisible;
    const hasta = pieza.angulo;
    const inicio = performance.now();

    // Un cuadro del giro: acerca anguloVisible al ángulo final según el tiempo que pasó
    function cuadro(ahora) {
      const t = Math.min((ahora - inicio) / DURACION_GIRO, 1);
      const suave = 1 - (1 - t) ** 3; // ease-out: arranca rápido y frena al final
      pieza.anguloVisible = desde + (hasta - desde) * suave;
      dibujar();
      if (t < 1) pieza.animacion = requestAnimationFrame(cuadro);
      else if (estado === "jugando" && piezas.every(estaDerecha)) ganar();
    }
    pieza.animacion = requestAnimationFrame(cuadro);
  }

  // Convierte la posición del clic en la pieza clickeada. El canvas puede verse
  // más chico que sus píxeles reales (CSS max-width), así que hay que escalar.
  function piezaEn(evento) {
    const rect = lienzo.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) * lienzo.width) / rect.width;
    const y = ((evento.clientY - rect.top) * lienzo.height) / rect.height;
    const columna = Math.floor(x / lado);
    const fila = Math.floor(y / lado);
    return piezas.findIndex((p) => p.columna === columna && p.fila === fila);
  }

  // pointerdown sirve para mouse y dedo. e.button: 0 = izquierdo, 2 = derecho.
  // Izquierdo resta 90° (gira a la izquierda) y derecho suma 90° (a la derecha).
  // En pantallas táctiles el toque llega como botón 0 → gira a la izquierda.
  lienzo.addEventListener("pointerdown", (e) => {
    if (estado !== "jugando") return;
    const pieza = piezas[piezaEn(e)];
    if (!pieza || pieza.fija) return;
    e.preventDefault();
    pieza.angulo += e.button === 2 ? 90 : -90;
    animarGiro(pieza);
  });

  // Sin esto, el clic derecho abre el menú contextual del navegador
  lienzo.addEventListener("contextmenu", (e) => e.preventDefault());

  // Resalta la pieza que está debajo del mouse (feedback de que se puede clickear)
  lienzo.addEventListener("pointermove", (e) => {
    if (estado !== "jugando") return;
    const indice = piezaEn(e);
    if (indice === piezaSobre) return;
    piezaSobre = indice;
    lienzo.classList.toggle("blocka__lienzo--sobre-pieza", indice >= 0 && !piezas[indice].fija);
    dibujar();
  });

  lienzo.addEventListener("pointerleave", () => {
    piezaSobre = -1;
    if (estado === "jugando") dibujar();
  });

  /* --- Reloj --- */

  // Si el nivel tiene tiempo máximo se muestra cuánto QUEDA; si no, cuánto pasó
  function mostrarReloj() {
    const { tiempoMaximo } = NIVELES[nivel];
    const quedan = tiempoMaximo - segundos;
    hudReloj.textContent = tiempoMaximo ? `⏱ Quedan ${formatearTiempo(Math.max(quedan, 0))}` : `⏱ ${formatearTiempo(segundos)}`;
    hudReloj.classList.toggle("blocka__reloj--urgente", Boolean(tiempoMaximo) && quedan <= 10);
  }

  // setInterval ejecuta la función cada 1000 ms; clearInterval lo frena
  function arrancarReloj() {
    segundos = 0;
    mostrarReloj();
    clearInterval(reloj);
    reloj = setInterval(() => {
      segundos++;
      mostrarReloj();
      revisarTiempoMaximo();
    }, 1000);
  }

  // En los niveles con tiempo máximo, pierde si el reloj ya llegó a ese tiempo
  function revisarTiempoMaximo() {
    const { tiempoMaximo } = NIVELES[nivel];
    if (tiempoMaximo && segundos >= tiempoMaximo) perder();
  }

  /* --- Ayudita (extra 3) --- */

  // Acomoda una pieza al azar de las que están mal, la deja fija y suma 5 segundos
  botonAyudita.addEventListener("click", () => {
    if (estado !== "jugando") return;
    const malUbicadas = piezas.filter((p) => !p.fija && !estaDerecha(p));
    if (malUbicadas.length <= 1) {
      mostrarToast("Te falta una sola pieza: ¡esa la podés vos!");
      return;
    }
    const pieza = malUbicadas[azar(malUbicadas.length)];
    // Lleva el ángulo a la vuelta completa más cercana (por ejemplo 270 → 360) para que gire lo mínimo
    pieza.angulo = Math.round(pieza.anguloVisible / 360) * 360;
    pieza.fija = true;
    animarGiro(pieza);

    segundos += SEGUNDOS_AYUDITA;
    mostrarReloj();
    mostrarToast(`Ayudita: +${SEGUNDOS_AYUDITA} segundos`);
    revisarTiempoMaximo();
  });

  /* --- Pantallas superpuestas al canvas (menú, sorteo, fin) --- */

  // Muestra una pantalla y oculta las otras; null = ninguna (se ve el canvas)
  function mostrarPantalla(nombre) {
    Object.entries(pantallas).forEach(([clave, pantalla]) => {
      pantalla.hidden = clave !== nombre;
    });
  }

  // HUD: nivel y filtros arriba del canvas
  function mostrarNivel() {
    const { filtros } = NIVELES[nivel];
    const nombres = filtros.length > 1 ? "Un filtro por pieza" : FILTROS[filtros[0]].nombre;
    hudNivel.textContent = `Nivel ${nivel + 1} de ${NIVELES.length} · ${nombres}`;
  }

  // Botones de nivel del menú principal (con el récord de cada uno)
  function armarOpcionesDeNivel() {
    document.getElementById("opciones-nivel").innerHTML = NIVELES.map((n, i) => {
      const record = leerRecord(i, cantidadPiezas);
      const detalle = n.filtros.length > 1 ? "Mezcla" : FILTROS[n.filtros[0]].nombre;
      return `
        <label class="opcion">
          <input type="radio" name="nivel" value="${i}" ${i === nivel ? "checked" : ""}>
          <span class="opcion__caja">
            <b>Nivel ${i + 1}</b>
            <small>${detalle}${n.tiempoMaximo ? ` · máx. ${formatearTiempo(n.tiempoMaximo)}` : ""}</small>
            <small>${record === null ? "Sin récord" : `Récord ${formatearTiempo(record)}`}</small>
          </span>
        </label>`;
    }).join("");
  }

  // Vuelve al menú principal: frena el reloj y muestra la pantalla del menú
  function abrirMenu() {
    estado = "menu";
    clearInterval(reloj);
    contenedor.classList.remove("blocka--jugando");
    botonAyudita.disabled = true;
    botonMenu.disabled = true;
    armarOpcionesDeNivel();
    mostrarPantalla("menu");
  }

  // Al cambiar la cantidad de piezas, los récords que se muestran son los de esa cantidad
  pantallas.menu.addEventListener("change", (e) => {
    if (e.target.name === "nivel") nivel = Number(e.target.value);
    if (e.target.name === "piezas") {
      cantidadPiezas = Number(e.target.value);
      armarOpcionesDeNivel();
    }
  });

  // "Comenzar": submit del formulario del menú
  pantallas.menu.addEventListener("submit", (e) => {
    e.preventDefault();
    comenzar();
  });

  /* --- Sorteo de la imagen (extra 1) --- */

  // Las miniaturas de todo el banco, para la animación del sorteo
  const sorteo = document.getElementById("sorteo");
  sorteo.innerHTML = IMAGENES.map((img) => `<img class="sorteo__miniatura" src="${img.archivo}" alt="${img.nombre}">`).join("");
  const miniaturas = [...sorteo.children];

  // Elige una imagen que todavía no salió (cuando salieron todas, vuelve a empezar)
  function elegirImagen() {
    if (usadas.size === IMAGENES.length) usadas.clear();
    const disponibles = IMAGENES.map((_, i) => i).filter((i) => !usadas.has(i));
    const elegida = disponibles[azar(disponibles.length)];
    usadas.add(elegida);
    return elegida;
  }

  // Animación tipo ruleta: el resaltado salta de miniatura en miniatura, cada vez más lento,
  // y frena en la elegida. Devuelve una Promise que se cumple cuando termina.
  function animarSorteo(elegida) {
    return new Promise((resolver) => {
      const saltos = IMAGENES.length * 2 + elegida; // dos vueltas completas y frena en la elegida
      let paso = 0;
      let espera = 60;

      // Un paso de la ruleta de miniaturas: resalta la siguiente y, al final, marca la elegida
      function saltar() {
        miniaturas.forEach((m, i) => m.classList.toggle("sorteo__miniatura--resaltada", i === paso % IMAGENES.length));
        if (paso === saltos) {
          miniaturas[elegida].classList.add("sorteo__miniatura--elegida");
          setTimeout(resolver, 900);
          return;
        }
        paso++;
        espera *= 1.1; // cada salto tarda un 10 % más: efecto de frenado
        setTimeout(saltar, espera);
      }
      saltar();
    });
  }

  /* --- Comenzar, ganar y perder --- */

  async function comenzar() {
    estado = "sorteo";
    mostrarNivel();
    hudReloj.textContent = "⏱ 00:00";
    miniaturas.forEach((m) => m.classList.remove("sorteo__miniatura--resaltada", "sorteo__miniatura--elegida"));
    mostrarPantalla("sorteo");

    // La imagen se descarga MIENTRAS corre la animación; Promise.all espera a las dos
    const elegida = elegirImagen();
    let imagen;
    try {
      [imagen] = await Promise.all([cargarImagen(IMAGENES[elegida].archivo), animarSorteo(elegida)]);
    } catch (error) {
      console.error(error);
      mostrarToast("No se pudo cargar la imagen. Probá de nuevo");
      abrirMenu();
      return;
    }

    armarNivel(imagen);
    dibujar();
    mostrarPantalla(null);
    estado = "jugando";
    contenedor.classList.add("blocka--jugando");
    botonAyudita.disabled = false;
    botonMenu.disabled = false;
    arrancarReloj(); // el temporizador arranca cuando la blocka ya está en pantalla
  }

  // Fin del nivel (ganado o perdido): frena el reloj y bloquea las piezas y la ayudita
  function terminar() {
    clearInterval(reloj);
    contenedor.classList.remove("blocka--jugando");
    lienzo.classList.remove("blocka__lienzo--sobre-pieza");
    botonAyudita.disabled = true;
    piezaSobre = -1;
  }

  // Fundido de la imagen filtrada a la original (también con requestAnimationFrame)
  function revelar() {
    resuelta = true;
    const inicio = performance.now();
    return new Promise((resolver) => {
      // Un cuadro del fundido: sube la opacidad de las piezas originales sobre las filtradas
      function cuadro(ahora) {
        opacidadOriginal = Math.min((ahora - inicio) / DURACION_REVELADO, 1);
        dibujar();
        if (opacidadOriginal < 1) requestAnimationFrame(cuadro);
        else resolver();
      }
      requestAnimationFrame(cuadro);
    });
  }

  // Nivel resuelto: revela la imagen original, guarda el récord si lo es y muestra el cartel
  async function ganar() {
    estado = "ganado";
    terminar();
    const recordAnterior = leerRecord(nivel, cantidadPiezas);
    const esRecord = recordAnterior === null || segundos < recordAnterior;
    if (esRecord) guardarRecord(nivel, cantidadPiezas, segundos);

    await revelar();
    const esUltimo = nivel === NIVELES.length - 1;
    mostrarFin({
      titulo: esUltimo ? "¡Completaste todos los niveles!" : `¡Nivel ${nivel + 1} completo!`,
      detalle: esRecord
        ? `Tiempo: ${formatearTiempo(segundos)} · ¡Nuevo récord!`
        : `Tiempo: ${formatearTiempo(segundos)} · Récord: ${formatearTiempo(recordAnterior)}`,
      seguir: esUltimo ? "Volver a jugar" : "Siguiente nivel",
    });
  }

  // Se acabó el tiempo máximo: muestra el cartel de derrota
  function perder() {
    estado = "perdido";
    terminar();
    dibujar();
    mostrarFin({ titulo: "¡Se acabó el tiempo!", detalle: "La blocka quedó sin armar", seguir: "Reintentar" });
  }

  // Muestra el cartel de fin de nivel con su título, detalle y texto del botón para seguir
  function mostrarFin({ titulo, detalle, seguir }) {
    document.getElementById("fin-titulo").textContent = titulo;
    document.getElementById("fin-detalle").textContent = detalle;
    document.getElementById("fin-seguir").textContent = seguir;
    pantallas.fin.classList.toggle("blocka__pantalla--perdido", estado === "perdido");
    mostrarPantalla("fin");
  }

  // Ganó → pasa al siguiente nivel (después del último, vuelve al 1). Perdió → repite el nivel.
  document.getElementById("fin-seguir").addEventListener("click", () => {
    if (estado === "ganado") nivel = (nivel + 1) % NIVELES.length;
    comenzar();
  });

  document.getElementById("fin-menu").addEventListener("click", abrirMenu);
  botonMenu.addEventListener("click", () => {
    terminar();
    abrirMenu();
  });

  // Canvas vacío detrás del menú hasta que arranca el primer nivel
  lienzo.width = ALTO_MAXIMO;
  lienzo.height = ALTO_MAXIMO;
  ctx.fillStyle = COLOR_SEPARACION;
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  mostrarNivel();
  abrirMenu();
}

/* ---------- 4. Comunidad e inicio ---------- */

const COMENTARIOS = [
  { nick: "glitchqueen", fecha: "hace un día", texto: "El nivel del negativo me voló la cabeza: no sabés para dónde va el cielo. Muy bueno." },
  { nick: "PixelWarrior", fecha: "hace tres días", texto: "La ayudita salva, pero los 5 segundos duelen cuando vas por el récord." },
  { nick: "manu_rgb", fecha: "hace una semana", texto: "Con 8 piezas y un filtro distinto en cada una es otro juego. Me encanta la ruleta del principio." },
];

// Arranca todo lo de la página de Blocka
function iniciarPaginaBlocka() {
  iniciarComun();
  iniciarBlocka();
  iniciarCompartir("Jugá Blocka: Pixel Puzzle en NeoArcade");
  iniciarComunidad(COMENTARIOS);
}

iniciarPaginaBlocka();
