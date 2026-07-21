# Resumen — corrección verificada contra tu PDF real

## Lo que encontramos
Con el archivo real que compartiste (Mayte, 21/09/2010) localizamos el
problema exacto: en la transición de la página 3 a la 4, la línea
"3. Código C (Fortaleza Interna™)..." — parte del listado dentro de
Instrucciones — quedaba rebanada horizontalmente por la mitad: la mitad
superior de las letras en el fondo de una página, la mitad inferior al
inicio de la siguiente. Confirmamos el mismo patrón en varias de las
transiciones que reportaste.

## Verificación
Regeneramos el Mapa con exactamente tu mismo nombre y fecha de
nacimiento, usando la versión más reciente del código (con todas las
correcciones acumuladas de las rondas anteriores: medición de posición
de línea corregida, manejo de salto de página forzado, margen de
seguridad ampliado, y espera real a que las fuentes carguen). Extrajimos
las 36 páginas resultantes directamente de la estructura del PDF y
revisamos cada una de las 35 transiciones entre páginas: ninguna mostró
texto cortado o distorsionado.

Tu PDF original se generó con una versión anterior del código, antes de
que aplicáramos las últimas correcciones — por eso mostraba el problema
que la versión actual ya no reproduce.

## Qué hacer
Sube este `app.js` a tu repositorio (reemplazando el actual) y genera un
Mapa nuevo para confirmar de tu lado. Si por cualquier motivo el
problema persistiera en algún punto distinto, comparte el PDF resultante
igual que esta vez — con el archivo real podemos verificar con precisión
en vez de intentar adivinar.
