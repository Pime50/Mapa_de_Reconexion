# Cambios en este paquete

Solo 2 archivos fueron modificados. El resto está incluido sin cambios,
por si prefieres subir la carpeta completa como reemplazo directo.

## Archivos modificados
- `style.css`
- `app.js`

## Archivos sin cambios (incluidos igual, para reemplazo completo)
- `index.html`
- `admin.html`
- `body_src.html`
- `package.json`
- `api/_redis.js`
- `api/check-token.js`
- `api/redeem-token.js`

---

## Ronda 5 — causa raíz REAL del corte de líneas por la mitad (confirmada y verificada)

Esta vez el reporte fue más específico y clave para encontrar el problema
real: no era una palabra dividida en dos renglones (eso ya estaba
resuelto desde la Ronda 4), sino la MISMA línea de texto rebanada
horizontalmente por la mitad — la mitad superior de las letras quedaba al
fondo de una página, y la mitad inferior de esas mismas letras aparecía
al inicio de la siguiente.

**Archivo:** `app.js` → `buildExportRoot` (una línea clave agregada)

Causa encontrada instrumentando la generación real del PDF (no una
simulación) y comparando los números exactos que el sistema estaba
usando: el contenedor de cada sección del Mapa (`.pdf-section`) no tenía
la propiedad CSS `position: relative`. Sin ella, el navegador no lo trata
como una referencia válida al medir "a qué distancia está este texto
del inicio de su sección" — y en ciertos casos la medición se saltaba esa
sección por completo y sumaba también la altura de TODAS las secciones
anteriores del documento (Portada + Instrucciones + Código A, etc.),
dando coordenadas de línea equivocadas por miles de píxeles.

Con esas coordenadas mal calculadas, la protección "no cortar a mitad de
una línea de texto" (agregada en la Ronda 4) comparaba contra posiciones
que no correspondían al texto real — por eso parecía estar activa pero
nunca lograba evitar el corte real.

La corrección es una sola línea: `wrap.style.position = "relative"` al
crear cada sección de exportación. Con eso, la medición de posición de
cada línea de texto queda exacta.

**Verificación:** reproduje tu caso exacto (Código B, número 1, tarjeta
"SEÑALES DE QUE HABITAS TU ESENCIA", específicamente el ítem "Inicias
nuevos proyectos desde la claridad, no desde la urgencia") generando el
PDF real y confirmé que antes del fix esa línea aparecía duplicada y
rebanada entre dos páginas, y después del fix aparece una sola vez,
completa, sin cortes. Además recorrí las 32 páginas del documento
completo buscando específicamente el patrón de "línea repetida/duplicada
entre página y la siguiente" (el síntoma exacto que reportaste) y no
quedó ninguno.

---

## Ronda 4 — protección contra bloques más altos que una página

**Archivo:** `app.js` → `collectLineBreaks`, `findSafeCut` (reescrita)

Se agregó la capacidad de cortar por línea de texto (no solo por bloque
completo) para cuando un bloque como una tarjeta larga no cabe entero en
una página. Este cambio era necesario pero, como se descubrió en la
Ronda 5, no era suficiente por sí solo: la medición de posición de cada
línea tenía el bug de `position: relative` descrito arriba, que hacía
que la protección no funcionara en la práctica para varios casos.

---

## Ronda 3 — causa raíz real del error de generación del PDF

**Archivo:** `app.js` → `resolveHex`, `calloutBgFor`, `THEME_HEX`,
`panelHero` actualizada
**Archivo:** `style.css` → `.block-callout`

`color-mix()` (usado en la Ronda 1 para el resaltado) no es compatible
con `html2canvas@1.4.1` — lanza `Attempting to parse an unsupported
color function` al capturar la página, lo que interrumpía toda la
generación del PDF. Solución: el color de fondo del bloque de revelación
ahora se calcula en JavaScript con `rgba()` en vez de con `color-mix()`.

**Confirmado por Tere: el PDF ya abre correctamente en iPhone, y el
resaltado del bloque de revelación quedó correcto.**

---

## Ronda 2

### Error al descargar el PDF (paginado) — bug real corregido, pero no
era la causa raíz del error reportado en ese momento (esa se identificó
en la Ronda 3)
**Archivo:** `app.js` → `renderSectionToPdf`, `generatePdf`

### El texto de revelación clave no quedaba resaltado
**Archivo:** `app.js` → `findRevelationIndex`, `normalizeItems`

Detección por posición estructural (el párrafo justo antes de "PASO 4" en
cada código), verificada contra las 42 combinaciones reales de código ×
número del contenido actual. **Confirmado por Tere: quedó correcto.**

---

## Ronda 1

### Resaltado del bloque de revelación clave
**Archivo:** `style.css` → clase `.block-callout`

### Corte de texto entre páginas del PDF — primer intento, insuficiente
**Archivo:** `app.js` → `offsetFrom`, `collectBreakRects`

### PDF en blanco al abrir en iPhone/Safari
**Archivo:** `app.js` → `buildExportRoot`, `generatePdf`,
`renderSectionToPdf`, `captureSection`

Captura del Mapa sección por sección para no exceder el límite de área de
canvas de Safari/iOS. **Confirmado por Tere: quedó correcto.**
