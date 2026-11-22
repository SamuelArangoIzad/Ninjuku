# Ninjuku G1 — HUD y energía (parche inicial)

## Cambios
- Game Over: UUID v4 compatible con HTTP en IP local; producción requiere HTTPS y validación de resultados del lado servidor.
- HUD del jugador: barra de vida roja segmentada con estética pixel art; los enemigos mantienen su barra existente.
- Barra de energía azul: cinco segmentos iniciales, consumo de un segmento cada 3 segundos colgado, regeneración de uno cada 15 segundos fuera del estado HOOKED.
- A cero energía el ninja se suelta, y no puede iniciar otro enganche hasta recuperar al menos un segmento.
- La lógica de vida, daños y corazones de recuperación no se modifica.

## Instalación
Descomprimir el ZIP del parche sobre una copia de la raíz del repositorio `Ninjuku`, preservando las rutas `src/...`. No sobrescribir `public/`.

## Verificación en entorno local
1. `npm ci` y `npm run build`.
2. `npm run dev -- --host 0.0.0.0`, probar `http://localhost:5173/` y `http://192.168.10.10:5173/`.
3. Morir en ambas URLs: comprobar Game Over, guardado local y botón reiniciar.
4. Engancharse: confirmar descenso de una barra cada 3 segundos y caída al agotarla.
5. Soltarse: confirmar regeneración de una barra cada 15 segundos; recoger corazón: debe regenerar vida pero no energía.
6. Verificar reinicio de vida/energía en una nueva partida y funcionamiento de barras enemigas.

## Límites
Los cálculos de energía son locales (prototipo individual). En el futuro multijugador los validará el servidor. La regeneración no se acumula durante el enganche. El generador de UUID tiene un fallback de desarrollo sin criptografía para HTTP LAN, que no debe considerarse protección antifraude. La compilación en este entorno no pudo completarse por ausencia de dependencias instalables con acceso a la red; validación de sintaxis y pruebas de lógica independientes sí realizadas.
