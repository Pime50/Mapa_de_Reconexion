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

## Ronda 4 — corte de palabras entre páginas del PDF (causa raíz real)

**Archivo:** `app.js` → `collectLineBreaks` (nueva), `nearestLineBreak`
(nueva), `findSafeCut` (reescrita), `renderSectionToPdf`, `generatePdf`

El sistema ya sabía mantener un bloque completo (un párrafo, una tarjeta)
sin partirlo entre dos páginas — pero no tenía ninguna estrategia para
cuando ese bloque era, él solo, más alto que una página entera (por
ejemplo la tarjeta "CONSECUENCIA" con un párrafo largo dentro de "PASO 3 ·
DESCUBRE TU PATRÓN OCULTO"). En ese caso, al no encontrar ningún corte
"seguro", el sistema usaba como último recurso un corte "duro" en
cualquier punto — lo que podía caer a mitad de una palabra u oración.

La solución agrega una segunda red de seguridad, más fina: además de los
rangos de bloques completos, ahora también se mide la posición exacta de
cada LÍNEA de texto individual (aprovechando cómo el navegador ya partió
cada párrafo al hacer word-wrap). Cuando un bloque es más alto que una
página, el sistema:
1. Lo inicia en una página nueva y limpia, para aprovechar el máximo
   espacio posible antes del primer corte.
2. Calcula el corte exactamente en el límite entre dos líneas de texto
   dentro de ese bloque — nunca a mitad de una.

**Verificación exhaustiva:** generé el Mapa completo (32 páginas) con el
mismo caso que reportaste (Código A, tarjeta "CONSECUENCIA") y confirmé
visualmente que el corte ahora cae al final de una oración completa. Además
recorrí las 32 páginas con tres métodos de verificación independientes:
inspección visual directa, un análisis automático de fin/inicio de oración
en cada salto de página, y una búsqueda específica de guiones de corte de
sílabas (el indicador definitivo de una palabra partida). Ningún método
encontró palabras cortadas a la mitad en el documento completo.

Nota: en un punto del documento (fin de la Fase 6) el corte deja una
única línea corta al inicio de la página siguiente ("viuda" tipográfica)
— esto es una cuestión estética menor, no un corte de palabra, y no es lo
que se reportó. Si en algún momento se quiere pulir eso también, es un
ajuste independiente y menor.

---

## Ronda 3 — causa raíz real del error de generación del PDF

**Archivo:** `app.js` → `resolveHex`, `calloutBgFor`, `THEME_HEX`,
`panelHero` actualizada
**Archivo:** `style.css` → `.block-callout`

Reproduje el flujo completo (formulario → generar Mapa → descargar PDF)
en un navegador real de forma automatizada para capturar el error exacto.
Causa: `color-mix()` (usado en la Ronda 1 para el resaltado) no es
compatible con `html2canvas@1.4.1` — lanza `Attempting to parse an
unsupported color function` al intentar capturar la página, lo que
interrumpía toda la generación del PDF. Se veía perfecto en el navegador
normal (por eso el resaltado en sí quedó confirmado como correcto), pero
rompía específicamente la conversión a PDF.

Solución: el color de fondo del bloque de revelación ahora se calcula en
JavaScript con `rgba()` (la misma técnica ya usada, sin problemas, para
los degradados de fondo), en vez de con la función CSS `color-mix()`.
Visualmente idéntico, 100% compatible con html2canvas.

**Confirmado por Tere: el PDF ya abre correctamente en iPhone.**

---

## Ronda 2

### Error al descargar el PDF (paginado) — bug real corregido, pero no
era la causa raíz del error reportado (esa se identificó en la Ronda 3)
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



