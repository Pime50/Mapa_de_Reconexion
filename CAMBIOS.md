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

## Ajuste 1 — Resaltado del bloque de revelación clave
**Archivo:** `style.css` → clase `.block-callout`

El fondo pasó de blanco translúcido fijo a un color derivado del color de
la fase activa (`--panel-color`), usando `color-mix()`. Como esa variable
ya se define dinámicamente por cada pestaña/código, el resaltado aparece
automáticamente en los 4 códigos (A, B, C, D) sin tocar el JS ni repetirlo
manualmente. También se refleja en el PDF descargado.

## Ajuste 2 — Corte de texto entre páginas del PDF
**Archivo:** `app.js` → funciones `offsetFrom` (nueva) y `collectBreakRects`

La causa era que la medición de "dónde empieza y termina cada bloque"
usaba `getBoundingClientRect()`, que mide contra el viewport visible y
no es confiable en un contenedor fuera de pantalla muy alto. Se cambió
a una medición por `offsetTop` real del documento, que es exacta sin
importar el tamaño total. El sistema de "corte seguro" que ya existía
ahora funciona correctamente.

## Ajuste 3 — PDF en blanco al abrir en iPhone/Safari
**Archivo:** `app.js` → `buildExportRoot`, `generatePdf`, `renderSectionToPdf`
(nueva), `captureSection` (nueva)

Safari en iOS limita el área de un canvas a ~16.7 millones de píxeles,
muy por debajo de Chrome/desktop (268M+). El documento completo generaba
un canvas de ~74M píxeles, así que Safari lo devolvía vacío sin mostrar
ningún error — por eso el PDF se abría en blanco.

Ahora la app captura el Mapa **sección por sección** (Portada, Instrucciones,
cada Código, Fase 5, Fase 6, Cierre) en vez de una sola captura gigante,
y va ensamblando las páginas del PDF progresivamente. Cada sección
individual queda muy por debajo del límite de iOS. Como protección extra,
si alguna sección fuera excepcionalmente larga, la escala de captura se
reduce automáticamente solo para esa sección — sin afectar la nitidez del
resto del documento.

**Recomendación:** después de subir este cambio, prueba la descarga del
PDF en un iPhone real (o el simulador de Safari/iOS) para confirmar que
ya se ve el contenido completo, además de repetir la prueba en Android/
desktop para confirmar que no se rompió nada ahí.
