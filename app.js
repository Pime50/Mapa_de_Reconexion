/* =========================================================
   MAPA DE RECONEXIÓN PERSONAL™ — Motor de la aplicación
   ========================================================= */
(function () {
  "use strict";

  var CONTENT = JSON.parse(document.getElementById("content-data").textContent);

  var TABS = [
    { id: "portada", icon: "🏡", label: "Portada", color: "var(--purple)", colorDark: "var(--purple-d)" },
    { id: "instrucciones", icon: "🧭", label: "Instrucciones", color: "var(--purple)", colorDark: "var(--purple-d)" },
    { id: "codigoA", icon: "🌀", label: "Fase 1 - Sobrecarga", color: "var(--purple)", colorDark: "var(--purple-d)" },
    { id: "codigoB", icon: "💗", label: "Fase 2 - Esencia", color: "var(--pink)", colorDark: "var(--pink-d)" },
    { id: "codigoC", icon: "🌿", label: "Fase 3 - Fortaleza", color: "var(--turquoise)", colorDark: "var(--turquoise-d)" },
    { id: "codigoD", icon: "☀️", label: "Fase 4 - Camino de Vida", color: "var(--yellow)", colorDark: "var(--yellow-d)" },
    { id: "fase5", icon: "✨", label: "Fase 5 · Alineación Total", color: "var(--purple)", colorDark: "var(--purple-d)" },
    { id: "fase6", icon: "🕊️", label: "Fase 6 · Reencuentro Sagrado", color: "var(--turquoise)", colorDark: "var(--turquoise-d)" },
    { id: "cierre", icon: "🎁", label: "Cierre & Descarga", color: "var(--yellow)", colorDark: "var(--yellow-d)" }
  ];

  var state = { name: "", day: null, month: null, year: null, codes: null, activeTab: 0, token: null };

  /* ---------------------------------------------------------
     0. CONTROL DE ACCESO — enlace de un solo uso
     Cada link debe incluir ?token=ALGO-UNICO. El servidor (api/check-token
     y api/redeem-token, respaldados por Upstash Redis en Vercel) es la
     única fuente de verdad: un token solo puede "canjearse" una vez.
     --------------------------------------------------------- */
  function getTokenFromURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      var t = (params.get("token") || "").trim();
      return t;
    } catch (e) {
      return "";
    }
  }

  function showGate(title, message) {
    document.getElementById("gateTitle").textContent = title;
    document.getElementById("gateMessage").textContent = message;
    document.getElementById("gateScreen").classList.remove("hidden");
    document.getElementById("formScreen").classList.add("hidden");
  }

  function unlockForm() {
    document.getElementById("gateScreen").classList.add("hidden");
    document.getElementById("formScreen").classList.remove("hidden");
  }

  function initAccessGate() {
    var token = getTokenFromURL();

    if (!token) {
      showGate(
        "Este enlace no es válido",
        "Este Mapa de Reconexión Personal™ necesita un enlace personal para poder abrirse. Si crees que esto es un error, contacta a Tere Becerra Huerta para que te comparta tu acceso."
      );
      return;
    }

    state.token = token;

    fetch("/api/check-token?token=" + encodeURIComponent(token), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.valid) {
          unlockForm();
        } else if (data && data.reason === "used") {
          showGate(
            "Este enlace ya fue utilizado",
            "Este Mapa de Reconexión Personal™ ya fue generado anteriormente con este enlace. Cada acceso es válido para un solo uso.\n\nSi necesitas ayuda, contacta a soporte@terebecerrahuerta.net o escríbenos al +(52) 871-111-4224."
          );
        } else {
          showGate(
            "Este enlace no es válido",
            "No pudimos validar tu acceso. Contacta a Tere Becerra Huerta para confirmar tu enlace."
          );
        }
      })
      .catch(function () {
        showGate(
          "No pudimos verificar tu enlace",
          "Revisa tu conexión a internet e intenta de nuevo. Si el problema continúa, contacta a Tere Becerra Huerta."
        );
      });
  }

  function redeemToken() {
    return fetch("/api/redeem-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.token })
    })
      .then(function (r) { return r.json().then(function (data) { return { status: r.status, data: data }; }); })
      .then(function (res) {
        return !!(res.data && res.data.ok);
      })
      .catch(function () { return false; });
  }

  /* ---------------------------------------------------------
     1. NUMEROLOGÍA
     --------------------------------------------------------- */
  function sumDigits(n) {
    return String(Math.abs(n)).split("").reduce(function (a, d) { return a + parseInt(d, 10); }, 0);
  }

  function reducir(n) {
    n = Math.abs(n);
    while (n > 9 && n !== 11 && n !== 22) {
      n = sumDigits(n);
    }
    return n;
  }

  function computeCodes(day, month, year) {
    var A = reducir(month);
    var B = reducir(day);
    var C = reducir(sumDigits(year));
    // Código D: se suman los dígitos de día + mes + año de forma abierta,
    // SIN reducir cada componente antes. Solo se reduce (respetando 11/22) el total final.
    var rawTotal = sumDigits(day) + sumDigits(month) + sumDigits(year);
    var D = reducir(rawTotal);
    return { A: A, B: B, C: C, D: D };
  }

  function parseDate(str) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str.trim());
    if (!m) return null;
    var day = parseInt(m[1], 10), month = parseInt(m[2], 10), year = parseInt(m[3], 10);
    if (month < 1 || month > 12) return null;
    var daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return null;
    if (year < 1900 || year > new Date().getFullYear()) return null;
    return { day: day, month: month, year: year };
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  /* ---------------------------------------------------------
     2. FORMULARIO — máscara + validación
     --------------------------------------------------------- */
  var dateInput = document.getElementById("birthDate");
  dateInput.addEventListener("input", function () {
    var v = dateInput.value.replace(/[^\d]/g, "").slice(0, 8);
    var out = v;
    if (v.length > 4) out = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
    else if (v.length > 2) out = v.slice(0, 2) + "/" + v.slice(2);
    dateInput.value = out;
  });

  document.getElementById("mapForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var nameInput = document.getElementById("fullName");
    var name = nameInput.value.trim();
    var dateStr = dateInput.value.trim();
    var errName = document.getElementById("errName");
    var errDate = document.getElementById("errDate");
    var valid = true;

    if (name.length < 3) {
      nameInput.classList.add("error");
      errName.classList.add("show");
      valid = false;
    } else {
      nameInput.classList.remove("error");
      errName.classList.remove("show");
    }

    var parsed = parseDate(dateStr);
    if (!parsed) {
      dateInput.classList.add("error");
      errDate.classList.add("show");
      valid = false;
    } else {
      dateInput.classList.remove("error");
      errDate.classList.remove("show");
    }

    if (!valid) return;

    var submitBtn = document.querySelector("#mapForm .btn-generate");
    submitBtn.disabled = true;
    var originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Verificando tu acceso…";

    redeemToken().then(function (success) {
      if (!success) {
        showGate(
          "Este enlace ya fue utilizado",
          "Este Mapa de Reconexión Personal™ ya fue generado anteriormente con este enlace. Cada acceso es válido para un solo uso. Si necesitas ayuda, contacta a Tere Becerra Huerta."
        );
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        return;
      }

      state.name = name;
      state.day = parsed.day;
      state.month = parsed.month;
      state.year = parsed.year;
      state.codes = computeCodes(parsed.day, parsed.month, parsed.year);

      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      launchApp();
    });
  });

  initAccessGate();

  /* ---------------------------------------------------------
     3. NORMALIZADOR DE CONTENIDO -> BLOQUES
     --------------------------------------------------------- */
  function isDivider(text) {
    return /^[\s─\-–—]+$/.test(text) && /[─\-–—]/.test(text);
  }

  function isStep(text) {
    // "PASO N · ..." (Fase 6) o "CIERRE · ..." (el único "paso" de la pestaña
    // de Cierre — build_content.py renombra ahí el antiguo "PASO 3" para que
    // no aparezca un número de paso fuera de contexto).
    return /^PASO\s+\d+/i.test(text.trim()) || /^CIERRE\s*·/i.test(text.trim());
  }

  function isHeading(text) {
    if (text.indexOf("\n") !== -1) return false;
    if (text.length > 72) return false;
    if (/[.!?…]\s*$/.test(text.trim()) && text.length > 40) return false;
    return true;
  }

  function parseCardText(raw) {
    var lines = raw.split("\n");
    var title = (lines.shift() || "").trim();
    var groups = [];
    var currentGroup = null;

    function pushGroup(type) {
      currentGroup = { type: type, lines: [] };
      groups.push(currentGroup);
    }

    lines.forEach(function (line) {
      var t = line.trim();
      if (!t) { currentGroup = null; return; }
      var type = "plain";
      if (t.charAt(0) === "☐" || t.charAt(0) === "□") { type = "checkbox"; t = t.slice(1).trim(); }
      else if (t.charAt(0) === "•") { type = "bullet"; t = t.slice(1).trim(); }
      if (!currentGroup || currentGroup.type !== type) pushGroup(type);
      currentGroup.lines.push(t);
    });

    return { title: title, groups: groups };
  }

  function normalizeItems(items) {
    var blocks = [];
    items.forEach(function (item) {
      if (item.type === "signature") {
        blocks.push({ kind: "signature", lines: item.lines });
        return;
      }
      if (item.type === "declaration") {
        blocks.push({ kind: "declaration", text: item.text });
        return;
      }
      if (item.type === "table") {
        var rows = item.rows;
        if (rows.length === 1) {
          blocks.push({ kind: "card", card: parseCardText(rows[0][0]) });
        } else {
          var cards = [];
          rows.forEach(function (r) { r.forEach(function (cellText) { cards.push(parseCardText(cellText)); }); });
          blocks.push({ kind: "cardgrid", cards: cards });
        }
        return;
      }
      var text = item.text;
      if (isDivider(text)) { blocks.push({ kind: "divider" }); return; }
      if (isStep(text)) { blocks.push({ kind: "step", text: text }); return; }
      if (isHeading(text)) { blocks.push({ kind: "heading", text: text }); return; }
      if (/^(coloca una mano|antes de leer)/i.test(text.trim()) === false && /respira profundo/i.test(text)) {
        blocks.push({ kind: "callout", text: text });
        return;
      }
      blocks.push({ kind: "paragraph", text: text });
    });
    return blocks;
  }

  /* ---------------------------------------------------------
     4. RENDER HTML DE BLOQUES
     --------------------------------------------------------- */
  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderCard(container, card) {
    var c = el("div", "card");
    if (card.title) c.appendChild(el("div", "card-title", escapeHtml(card.title)));
    card.groups.forEach(function (g) {
      if (g.type === "plain") {
        c.appendChild(el("p", "card-line plain", escapeHtml(g.lines.join(" "))));
      } else {
        g.lines.forEach(function (line) {
          c.appendChild(el("div", "card-line " + g.type, escapeHtml(line)));
        });
      }
    });
    container.appendChild(c);
  }

  function renderBlocks(container, blocks) {
    blocks.forEach(function (b) {
      switch (b.kind) {
        case "divider":
          container.appendChild(el("div", "block-divider", "✦ ✦ ✦"));
          break;
        case "heading":
          container.appendChild(el("div", "block-heading", "<span>" + escapeHtml(b.text) + "</span>"));
          break;
        case "step":
          var stepWrap = el("div", "block-step");
          // Los pasos numerados ("PASO 1", "PASO 2"...) muestran su número.
          // El paso de cierre ("CIERRE · ...") no tiene un número real dentro
          // de esa pestaña (es el único que aparece ahí), así que en vez de un
          // número fuera de contexto usamos un símbolo de cierre/logro (✓).
          var stepMatch = /PASO\s+(\d+)/i.exec(b.text);
          var num = stepMatch ? stepMatch[1] : "✓";
          var badge = el("div", "step-badge", num);
          if (!stepMatch) badge.classList.add("step-badge-closing");
          var label = el("div", "step-text", escapeHtml(b.text.replace(/^(PASO\s+\d+|CIERRE)\s*·?\s*/i, "")));
          stepWrap.appendChild(badge);
          stepWrap.appendChild(label);
          container.appendChild(stepWrap);
          break;
        case "callout":
          container.appendChild(el("div", "block-callout", escapeHtml(b.text)));
          break;
        case "paragraph":
          container.appendChild(el("p", "block-p", escapeHtml(b.text)));
          break;
        case "declaration":
          var declCard = el("div", "declaration-card");
          declCard.appendChild(el("div", "declaration-text", escapeHtml(b.text)));
          container.appendChild(declCard);
          break;
        case "card":
          renderCard(container, b.card);
          break;
        case "cardgrid":
          var grid = el("div", "card-grid");
          b.cards.forEach(function (card) { renderCard(grid, card); });
          container.appendChild(grid);
          break;
        case "signature":
          var sig = el("div", "signature-block");
          sig.appendChild(el("div", "sig-name", escapeHtml(b.lines[0] || "")));
          sig.appendChild(el("div", "sig-title", escapeHtml((b.lines.slice(1) || []).join(" · "))));
          container.appendChild(sig);
          break;
      }
    });
  }

  /* ---------------------------------------------------------
     5. CONSTRUCCIÓN DE PANELES
     --------------------------------------------------------- */
  function panelHero(container, opts) {
    var hero = el("div", "panel-hero");
    hero.style.setProperty("--panel-gradient", opts.gradient);
    hero.style.setProperty("--panel-color", opts.color);
    hero.style.setProperty("--panel-color-dark", opts.colorDark);
    if (opts.phase) hero.appendChild(el("div", "phase-label", escapeHtml(opts.phase)));
    if (opts.eyebrow) hero.appendChild(el("div", "eyebrow", escapeHtml(opts.eyebrow)));
    hero.appendChild(el("h2", "", escapeHtml(opts.title)));
    if (opts.number !== undefined) hero.appendChild(el("div", "panel-number", opts.number));
    if (opts.tagline) hero.appendChild(el("div", "panel-tagline", escapeHtml(opts.tagline)));
    container.appendChild(hero);
    container.style.setProperty("--panel-color", opts.color);
    container.style.setProperty("--panel-color-dark", opts.colorDark);
  }

  function gradientFor(hex) {
    return "linear-gradient(135deg, " + hexToRgba(hex, 0.22) + ", " + hexToRgba(hex, 0.06) + ")";
  }
  function hexToRgba(hex, a) {
    var c = hex.replace("#", "");
    var r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  var META = CONTENT.meta;

  function buildPortada(container) {
    panelHero(container, {
      eyebrow: "Código Maestro de Vida™",
      title: "Mapa de Reconexión Personal™",
      tagline: "Tu viaje de regreso a casa",
      color: "var(--purple)", colorDark: "var(--purple-d)",
      gradient: "linear-gradient(135deg, rgba(139,133,202,0.20), rgba(231,187,215,0.16), rgba(175,226,227,0.16), rgba(243,239,161,0.18))"
    });

    var meta = el("div", "portada-meta");
    meta.innerHTML = "Elaborado especialmente para <strong>" + escapeHtml(state.name) + "</strong><br>Fecha de nacimiento: " + pad2(state.day) + "/" + pad2(state.month) + "/" + state.year;
    container.appendChild(meta);

    var grid = el("div", "portada-codes");
    ["A", "B", "C", "D"].forEach(function (k) {
      var chip = el("div", "code-chip " + k.toLowerCase());
      chip.innerHTML =
        '<div class="code-letter">Código ' + k + "</div>" +
        '<div class="code-value">' + state.codes[k] + "</div>" +
        '<div class="code-name">' + META.codeNames[k] + "</div>";
      grid.appendChild(chip);
    });
    container.appendChild(grid);

    renderBlocks(container, normalizeItems(CONTENT.portada));
  }

  function buildInstrucciones(container) {
    panelHero(container, {
      eyebrow: "Antes de comenzar",
      title: "Instrucciones",
      tagline: "Cómo leer y habitar tu Mapa de Reconexión Personal™",
      color: "var(--purple)", colorDark: "var(--purple-d)",
      gradient: gradientFor(META.codeColors.A)
    });
    renderBlocks(container, normalizeItems(CONTENT.instrucciones));
  }

  var CODE_PHASE_NUMBER = { A: 1, B: 2, C: 3, D: 4 };

  function buildCodigo(container, code) {
    var num = String(state.codes[code]);
    var items = CONTENT.codigos[code][num];
    var color = META.codeColors[code];
    var colorDark = META.codeColorsDark[code];
    panelHero(container, {
      phase: "Fase " + CODE_PHASE_NUMBER[code],
      eyebrow: META.codeFullTitles[code],
      title: "Tu número es " + num,
      color: color, colorDark: colorDark,
      gradient: gradientFor(color)
    });
    if (items) {
      renderBlocks(container, normalizeItems(items));
    } else {
      container.appendChild(el("p", "block-p", "Contenido no disponible para este número todavía."));
    }
  }

  function buildFase5(container) {
    panelHero(container, {
      eyebrow: "Fase 5",
      title: "La Alineación Total™",
      tagline: "Tu alineación interior · El regreso a ti misma",
      color: "var(--purple)", colorDark: "var(--purple-d)",
      gradient: gradientFor(META.codeColors.A)
    });
    renderBlocks(container, normalizeItems(CONTENT.fase5));
  }

  function buildFase6(container) {
    panelHero(container, {
      eyebrow: "Fase 6",
      title: "El Reencuentro Sagrado™",
      tagline: "Tu Protocolo Diario de 15 Minutos · La Activación Final",
      color: "var(--turquoise)", colorDark: "var(--turquoise-d)",
      gradient: gradientFor(META.codeColors.C)
    });
    renderBlocks(container, normalizeItems(CONTENT.fase6));
  }

  function buildCierre(container) {
    panelHero(container, {
      eyebrow: "Para ti, " + state.name.split(" ")[0],
      title: "Cierre & Descarga",
      tagline: "Este no es un final. Es un comienzo.",
      color: "var(--yellow)", colorDark: "var(--yellow-d)",
      gradient: gradientFor(META.codeColors.D)
    });
    renderBlocks(container, normalizeItems(CONTENT.cierre));

    var box = el("div", "download-box");
    box.innerHTML = "<p>Lleva contigo tu Mapa completo, listo para imprimir y releer cuantas veces tu corazón lo necesite.</p>";
    var btn = el("button", "btn-download", "⬇️ Descargar Mi Mapa Personalizado (PDF)");
    btn.id = "downloadBtn";
    btn.addEventListener("click", handleDownload);
    box.appendChild(btn);
    container.appendChild(box);

    container.appendChild(el("div", "footer-note", "Con profundo amor · Tere Becerra Huerta · Creadora del Código Maestro de Vida™"));
  }

  var BUILDERS = {
    portada: buildPortada,
    instrucciones: buildInstrucciones,
    codigoA: function (c) { buildCodigo(c, "A"); },
    codigoB: function (c) { buildCodigo(c, "B"); },
    codigoC: function (c) { buildCodigo(c, "C"); },
    codigoD: function (c) { buildCodigo(c, "D"); },
    fase5: buildFase5,
    fase6: buildFase6,
    cierre: buildCierre
  };

  /* ---------------------------------------------------------
     6. NAVEGACIÓN DE PESTAÑAS
     --------------------------------------------------------- */
  function launchApp() {
    document.getElementById("formScreen").classList.add("hidden");
    var appScreen = document.getElementById("appScreen");
    appScreen.classList.remove("hidden");
    document.getElementById("headerClientName").textContent = state.name;

    var nav = document.getElementById("tabNav");
    var panelsWrap = document.getElementById("tabPanels");
    var progressTrack = document.getElementById("progressTrack");
    nav.innerHTML = "";
    panelsWrap.innerHTML = "";
    if (progressTrack) {
      progressTrack.innerHTML = "";
      TABS.forEach(function () { progressTrack.appendChild(el("div", "progress-seg")); });
    }

    TABS.forEach(function (tab, idx) {
      var btn = el("button", "tab-btn", '<span class="tab-icon">' + tab.icon + "</span><span>" + tab.label + "</span>");
      btn.style.setProperty("--tab-color", tab.color);
      btn.addEventListener("click", function () { goToTab(idx); });
      nav.appendChild(btn);

      var panel = el("div", "tab-panel");
      panel.id = "panel-" + tab.id;
      var contentWrap = el("div", "");
      BUILDERS[tab.id](contentWrap);

      var navActions = el("div", "panel-nav-actions");
      var prevBtn = el("button", "nav-arrow", "← Anterior");
      prevBtn.addEventListener("click", function () { goToTab(Math.max(0, idx - 1)); });
      if (idx === 0) prevBtn.disabled = true;
      navActions.appendChild(prevBtn);
      // La última pestaña (Cierre) no necesita "Siguiente": ya no hay a dónde avanzar.
      if (idx !== TABS.length - 1) {
        var nextBtn = el("button", "nav-arrow", "Siguiente →");
        nextBtn.addEventListener("click", function () { goToTab(Math.min(TABS.length - 1, idx + 1)); });
        navActions.appendChild(nextBtn);
      }
      contentWrap.appendChild(navActions);

      panel.appendChild(contentWrap);
      panelsWrap.appendChild(panel);
    });

    goToTab(0);
  }

  function goToTab(idx) {
    state.activeTab = idx;
    var navButtons = document.querySelectorAll(".tab-btn");
    var panels = document.querySelectorAll(".tab-panel");
    navButtons.forEach(function (b, i) { b.classList.toggle("active", i === idx); });
    panels.forEach(function (p, i) { p.classList.toggle("active", i === idx); });
    if (navButtons[idx] && navButtons[idx].scrollIntoView) {
      navButtons[idx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateProgress(idx);
  }

  function updateProgress(idx) {
    var track = document.getElementById("progressTrack");
    if (!track) return;
    var segs = track.querySelectorAll(".progress-seg");
    segs.forEach(function (seg, i) {
      var isFilled = i <= idx;
      seg.classList.toggle("filled", isFilled);
      seg.classList.toggle("current", i === idx);
      seg.style.background = isFilled
        ? "linear-gradient(90deg, " + TABS[i].colorDark + ", " + TABS[i].color + ")"
        : "";
    });
  }

  /* ---------------------------------------------------------
     7. GENERACIÓN DE PDF
     El PDF se genera capturando el mismo diseño visual que ya ve la
     clienta (héroes con degradados de color, tarjetas, insignias de
     paso, firma) en vez de texto plano — por eso reutilizamos las
     funciones BUILDERS existentes en un contenedor invisible, y luego
     tomamos una "foto" de alta resolución que se recorta en páginas
     tamaño Carta con jsPDF.
     --------------------------------------------------------- */
  function buildExportRoot() {
    var root = el("div", "pdf-export-root");
    root.style.position = "fixed";
    root.style.left = "-10000px";
    root.style.top = "0";
    root.style.width = "820px";
    root.style.background = "#FAFAF8";
    document.body.appendChild(root);

    var sectionBuilders = [
      buildPortada,
      buildInstrucciones,
      function (c) { buildCodigo(c, "A"); },
      function (c) { buildCodigo(c, "B"); },
      function (c) { buildCodigo(c, "C"); },
      function (c) { buildCodigo(c, "D"); },
      buildFase5,
      buildFase6,
      buildCierre
    ];

    sectionBuilders.forEach(function (fn) {
      var wrap = el("div", "pdf-section");
      fn(wrap);
      // El botón de descarga no tiene sentido dentro del propio PDF.
      var dl = wrap.querySelector(".download-box");
      if (dl && dl.parentNode) dl.parentNode.removeChild(dl);
      root.appendChild(wrap);
    });

    return root;
  }

  function cleanupExportRoot(root) {
    if (root && root.parentNode) root.parentNode.removeChild(root);
  }

  var PDF_SCALE = 2; // debe coincidir con el "scale" pasado a html2canvas más abajo

  // Elementos que NUNCA deben quedar cortados a la mitad entre dos páginas
  // (párrafos, tarjetas, encabezados, firma, la tarjeta de la declaración, etc.).
  var PDF_UNBREAKABLE_SELECTOR = [
    ".block-p", ".block-heading", ".block-step", ".block-callout",
    ".card", ".card-grid", ".signature-block", ".declaration-card",
    ".panel-hero", ".portada-codes", ".footer-note", ".block-divider"
  ].join(", ");

  // Recolecta, MIENTRAS el contenedor de exportación todavía está en el DOM,
  // el rango vertical (en px de documento, no de canvas) que ocupa cada
  // elemento "no partible". Esto se usa después para que el corte de cada
  // página del PDF nunca caiga dentro de uno de estos rangos.
  function collectBreakRects(root) {
    var rootTop = root.getBoundingClientRect().top;
    var rects = [];
    root.querySelectorAll(PDF_UNBREAKABLE_SELECTOR).forEach(function (elx) {
      var r = elx.getBoundingClientRect();
      rects.push({ top: r.top - rootTop, bottom: r.bottom - rootTop });
    });
    return rects;
  }

  // Dado un corte deseado (en px de documento), si cae dentro de alguno de
  // los rangos "no partibles", lo empuja hacia arriba hasta el inicio de ese
  // elemento — así el elemento completo pasa a la siguiente página en vez de
  // quedar cortado a la mitad.
  function findSafeCut(desiredYDom, rects) {
    var y = desiredYDom;
    var changed = true;
    var guard = 0;
    while (changed && guard < 25) {
      changed = false;
      guard++;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (y > r.top + 0.5 && y < r.bottom - 0.5) {
          y = r.top;
          changed = true;
        }
      }
    }
    return y;
  }

  function renderCanvasToPdf(canvas, breakRects) {
    var jsPDF = window.jspdf.jsPDF;
    var pageW = 612, pageH = 792; // Carta, en puntos
    var margin = 34;
    var contentW = pageW - margin * 2;
    var pxPerPt = canvas.width / contentW;
    var pageHeightPx = Math.max(1, Math.floor((pageH - margin * 2) * pxPerPt));

    var pdf = new jsPDF({ unit: "pt", format: "letter" });
    var renderedY = 0;
    var pageIndex = 0;

    while (renderedY < canvas.height) {
      var desiredEnd = Math.min(renderedY + pageHeightPx, canvas.height);
      var safeEnd = desiredEnd;
      if (desiredEnd < canvas.height) {
        var desiredEndDom = desiredEnd / PDF_SCALE;
        var safeEndDom = findSafeCut(desiredEndDom, breakRects);
        safeEnd = Math.round(safeEndDom * PDF_SCALE);
        // Si un solo bloque es más alto que una página completa, no hay corte
        // seguro posible: usamos el corte "duro" original como último recurso.
        if (safeEnd <= renderedY) safeEnd = desiredEnd;
      }
      var sliceHeightPx = safeEnd - renderedY;

      var sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      var ctx = sliceCanvas.getContext("2d");
      ctx.fillStyle = "#FAFAF8";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, renderedY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      var imgData = sliceCanvas.toDataURL("image/jpeg", 0.93);
      var sliceHeightPt = sliceHeightPx / pxPerPt;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, margin, contentW, sliceHeightPt);

      renderedY = safeEnd;
      pageIndex++;
    }

    var safeName = state.name.trim().replace(/\s+/g, "_").replace(/[\\/:*?"<>|]/g, "");
    var dateStr = pad2(state.day) + "_" + pad2(state.month) + "_" + state.year;
    pdf.save("Mapa_" + safeName + "_" + dateStr + ".pdf");
  }

  function generatePdf() {
    var root = buildExportRoot();
    return new Promise(function (resolve) { setTimeout(resolve, 80); })
      .then(function () {
        // Se recolectan los rangos "no partibles" ANTES de capturar/limpiar,
        // mientras el contenedor sigue en el DOM y sus medidas son válidas.
        var breakRects = collectBreakRects(root);
        return window.html2canvas(root, {
          scale: PDF_SCALE,
          backgroundColor: "#FAFAF8",
          useCORS: true,
          windowWidth: root.scrollWidth
        }).then(function (canvas) {
          return { canvas: canvas, breakRects: breakRects };
        });
      })
      .then(function (result) {
        cleanupExportRoot(root);
        renderCanvasToPdf(result.canvas, result.breakRects);
      })
      .catch(function (err) {
        cleanupExportRoot(root);
        throw err;
      });
  }

  function handleDownload() {
    var btn = document.getElementById("downloadBtn");
    btn.disabled = true;
    var originalText = btn.textContent;
    btn.textContent = "Generando tu documento…";

    generatePdf()
      .catch(function (err) {
        console.error(err);
        alert("Ocurrió un problema generando el documento. Intenta de nuevo.");
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = originalText;
      });
  }
})();
