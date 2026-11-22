# Ninjuku G1.6 — Correcciones de continuidad y optimización

## Condiciones
Aplicar después de G1.5-A y G1.5-B fondos conectados. Este parche no modifica el HUD ni mecánicas.

## Mejoras
1. `BackgroundManager.resize()` conserva el fondo actual y la fracción recorrida, sin reiniciar al primero tras rotar.
2. Se omite actualizar coordenadas de todos los paneles cuando el desplazamiento todavía no cambia de píxel. El reciclado sigue forzando su actualización.
3. Los 8 PNG continuos se convierten a WebP **sin pérdida** y el juego carga WebP. Los píxeles RGB se comprobaron idénticos tras decodificar. No hay parallax multicapa.
4. Pruebas automatizadas del gestor del fondo con escenas simuladas (`tests/backgroundManager.test.js`).

## Limitaciones
- La coincidencia de bordes no garantiza continuidad narrativa o arquitectónica entre distintas ilustraciones.
- El cambio de tamaño sigue recreando sprites de fondo; se preserva la posición relativa, no todos los objetos físicos del mundo.
- WebP reduce la transferencia y tamaño en disco, **no** el espacio de textura descomprimida de GPU.
- Los fondos siguen cargándose todos en el preload; futura optimización: carga por segmentos y atlas/capas.
- Probar en Android e iOS reales; el navegador local no certifica rendimiento móvil.
- No se toca el backend, las monedas ni Supabase.

## Comandos
````bash
npm test
npm run build
npm run dev
````

## Validaciones funcionales
- Recorrer 1→2, 2→3 y 8→1 sin líneas negras; verificar consistencia visual.
- Enganchar el kusarigama en plataformas cercanas a los cambios.
- Redimensionar o rotar en mitad de fondo 3: no debe volver visualmente al fondo 1.
- Medir FPS y memoria en móvil después de 5 rondas.

## Reversión
Restituir `src/scenes/GameScene.js` y `src/world/BackgroundManager.js` desde la copia o commit anterior; los `.webp` pueden permanecer sin usarse.
