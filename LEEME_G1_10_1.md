# Ninjuku G1.10.1 — Plataforma colgante de enemigos de tejado

## Causa comprobada

Existen dos fuentes de plataformas: `HangingPropManager` crea un `HangingSupportVisual` para cada imagen, pero `RoofEnemyManager` creaba la imagen `hanging-prop` para enemigos de tejado sin soporte. Estas últimas aparecen desde rondas tempranas y son más frecuentes desde la ronda 3.

## Solución

`RoofEnemyManager` incorpora `RoofHangingSupportVisual` asociado a cada miembro de su pool. Se muestra al ubicar el gancho, se oculta al aparcar el enemigo y se destruye con el pool. El soporte está anclado visualmente al borde del tejado y su viga termina en la argolla del colgante. No cambia la posición de la plataforma ni del punto de enganche, ni afecta las físicas o puntuaciones.

## Instalación

Aplicar sobre G1.10, sin cambios adicionales. Ejecutar `npm test`, `npm run build` y `npm run dev`. Verificar las rondas 2, 3 y 4, las plataformas de los enemigos de tejado y reinicios.

## Advertencia

Se validaron sintaxis y pruebas automatizadas. La integración visual en Phaser debe comprobarse en navegador. El soporte puede necesitar ajuste fino si algunos tejados cambian de altura o los elementos quedan fuera del encuadre.
