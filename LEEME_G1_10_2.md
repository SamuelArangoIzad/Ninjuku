# Ninjuku G1.10.2 — Corregir altura y separación del colgante de tejado

## Diagnóstico

El gestor situaba la argolla superior en `house.surfaceY - getHookDrop() - 129 * propScale`. En horizontal móvil esto podía desplazar la argolla casi hasta el borde superior del canvas. El soporte terminaba siendo excesivamente largo. Además, el hueco horizontal respecto al tejado era fijo (190 píxeles), demasiado grande en móviles compactos.

## Corrección

- Nuevo cálculo puro en `roofPropPlacement.js` que adapta el hueco horizontal a pantalla (130–190 píxeles).
- Margen superior de la argolla adaptativo a la pantalla, al menos 38 píxeles.
- Límite de elevación de la argolla respecto a la superficie del tejado.
- `RoofEnemyManager.placeProp()` utiliza la misma geometría para sprite, soporte y punto de enganche; no se generan desplazamientos diferentes.
- No cambia sprites, colisiones, daño, IA ni lógica de oleadas. **Sí cambia la posición de los enganches de enemigos de tejado**: hay que comprobar alcance del kusarigama y altura de los shuriken contra ellos.

## Instalar

Aplicar encima de G1.10.1 (no encima de una versión anterior). Ejecutar `npm test`, `npm run build` y `npm run dev`.

## Validación visual

En 915×412 y 780×360, llegar a rondas 2, 3 y 4. Confirmar que argolla, viga y poste se mantienen conectados, que los colgantes no aparecen cortados arriba, y que el ninja puede engancharse y combatir al enemigo de tejado. Si la altura de alguno sigue fallando, registrar resolución y captura. No integrar sin validar.
