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

## Ronda 3 — causa raíz real del error de PDF (confirmada con pruebas automatizadas)

Esta vez reproduje el flujo completo (formulario → generar Mapa → descargar
PDF) en un navegador real de forma automatizada, para capturar el error
exacto en vez de seguir infiriendo. La causa fue:

**`color-mix()` no es compatible con `html2canvas@1.4.1`** (la librería que
"fotografía" el Mapa para convertirlo en PDF). Ese es justo el CSS que usé
en la Ronda 1 para resaltar el bloque de revelación clave con el color de
la fase. Se veía perfecto en el navegador normal — por eso confirmaste que
el resaltado había quedado bien — pero al generar el PDF, `html2canvas`
no sabe interpretar `color-mix()` y lanza el error `Attempting to parse an
unsupported color function "color"`, que interrumpía toda la generación
y disparaba el mensaje "Ocurrió un problema generando el documento".

**Archivo:** `app.js` → nuevas funciones `resolveHex`, `calloutBgFor`,
variable `THEME_HEX`; función `panelHero` actualizada
**Archivo:** `style.css` → `.block-callout`

La solución: en vez de mezclar colores con CSS, ahora el color de fondo
del bloque de revelación se calcula directamente en JavaScript (con la
misma técnica `hexToRgba()` que ya se usaba, sin problemas, para los
degradados de fondo de cada pestaña) y se pasa como una variable CSS ya
resuelta (`--panel-callout-bg`). El resultado visual es idéntico, pero
usa solo `rgba()`, que sí es 100% compatible con html2canvas.

**Verificación:** generé el flujo completo end-to-end (formulario real →
cálculo de numerología → las 9 secciones → descarga) con un navegador
automatizado. El PDF resultante se generó correctamente: 32 páginas,
tamaño Carta, sin errores — y confirmé visualmente que el bloque de
revelación aparece con su fondo de color correctamente en el PDF.

### Nota técnica adicional (protección extra, no la causa de este error)
De paso, `handleDownload` ahora verifica que `jsPDF` y `html2canvas` estén
disponibles antes de generar el PDF, y reintenta cargarlos automáticamente
(con una fuente CDN alterna de respaldo) si por algún motivo no cargaron
— bloqueadores de anuncios, redes restrictivas, etc. Si aun así no logran
cargar, el mensaje de error ahora sí indica claramente que es un problema
de conexión, en vez de un error genérico.

---

## Ronda 2

### Error al descargar el PDF (paginado)
**Archivo:** `app.js` → `renderSectionToPdf`, `generatePdf`

Se corrigió un caso donde el cálculo de paginado podía generar una imagen
de altura inválida (0 o negativa) o páginas en blanco de más, lo cual
podía romper la generación en ciertos casos límite. Se probó contra
cientos de casos simulados sin fallos. (Nota: esto era un bug real y
quedó corregido, pero no era la causa del error reportado en la Ronda 2
— esa causa se identificó y confirmó en la Ronda 3, arriba.)

### El texto de revelación clave no quedaba resaltado
**Archivo:** `app.js` → `findRevelationIndex` (nueva), `normalizeItems`

Se detecta ahora por posición estructural (el párrafo justo antes de
"PASO 4" en cada código), verificado contra las 42 combinaciones reales
de código × número del contenido actual. **Confirmado por Tere: quedó
correcto.**

---

## Ronda 1

### Resaltado del bloque de revelación clave
**Archivo:** `style.css` → clase `.block-callout`

Fondo con el color de la fase activa en vez de blanco translúcido fijo.
(La implementación original usaba `color-mix()`, reemplazada en la
Ronda 3 por ser incompatible con html2canvas — ver arriba.)

### Corte de texto entre páginas del PDF
**Archivo:** `app.js` → `offsetFrom` (nueva), `collectBreakRects`

Medición de posición de bloques por `offsetTop` real en vez de
`getBoundingClientRect()`, más confiable en contenedores largos fuera
de pantalla.

### PDF en blanco al abrir en iPhone/Safari
**Archivo:** `app.js` → `buildExportRoot`, `generatePdf`,
`renderSectionToPdf`, `captureSection`

Captura del Mapa sección por sección (en vez de una sola captura
gigante) para no exceder el límite de área de canvas de Safari/iOS
(~16.7M px vs 268M+ en Chrome/desktop).

**Recomendación:** prueba de nuevo la descarga del PDF (idealmente desde
el mismo iPhone donde falló antes) y confirma que ya no aparece el error.


