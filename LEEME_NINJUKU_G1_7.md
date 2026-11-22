# Ninjuku G1.7 — panorama horizontal, validación experimental

- Se incluye una ilustración panorámica original con estética de pueblo japonés al atardecer, en un **máster de 5400×900**. Para ofrecer cierre de bucle exacto, la segunda mitad es una reflexión horizontal de la primera: es una medida estética provisional, no tres escenas diferentes.
- El juego carga únicamente **3 cortes de 1800×900** (`panorama1.webp` a `panorama3.webp`); el máster se conserva como fuente de edición.
- Se elimina la secuencia de los 8 fondos antiguos en la escena, pero no se borran sus archivos del proyecto; el gestor `BackgroundManager` sigue en modo `seamlessTiles: true` (sin crossfade).
- Se sustituyen anclajes de plataformas por 6 coordenadas de referencia para el nuevo fondo. **Estos anclajes deben validarse visualmente**: los objetos cuelgan cerca de ramas, pero no se ha comprobado su precisión contra un navegador móvil.
- No se modifican combate, vida, energía, puntajes, autenticación ni economía.

## Instalación
1. Respaldar tu rama de desarrollo, incluido código sin seguimiento.
2. Descomprimir ZIP desde la raíz del repositorio.
3. `python tools/verificar_panorama.py` (requiere Pillow); `npm test && npm run build && npm run dev`.
4. En navegador móvil horizontal, recorrer el mapa completo, comprobar borde al ciclo, colisiones y enganches.

## Limitaciones
- Es una panorámica continua por segmentos; **todavía no es parallax por capas**.
- La primera y segunda mitad son simétricas, por lo que habrá repetición reconocible a largo plazo.
- La imagen original es una escena decorativa: el suelo físico sigue siendo independiente y las plataformas de madera se generan por código.
- La continuidad de las uniones internas proviene de cortes contiguos del máster, no de mezcla o retoques.
