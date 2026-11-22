# Ninjuku G1.2 — HUD japonés y revisión técnica

## Alcance
- Barra de vida y energía: iconos pixelados con relieve, segmentos más visibles, borde dorado/lacado, separador y contraste semitransparente.
- Mayor separación vertical: vida en `y=47`, energía en `y=115`.
- Marcador de puntuación: tablilla japonesa translúcida con doble borde, puntuación y ornamentos. Reubicado a `y=76` para que no se superponga con el botón HTML «Cuenta / Monedas».
- En pantallas estrechas (`<460px`), el marcador se mueve bajo las barras de estado para evitar solaparse con el marcador izquierdo.
- Rendimiento: se limita el redibujado de la barra energética al cambio mínimo de 0,4% o extremos, en lugar de hacerlo cada fotograma mientras se gasta energía.
- Se conservan daño, curación, 5 segmentos, drenaje (3 s por segmento), regeneración (15 s por segmento fuera del enganche), puntuación y multiplicadores.

## Archivos incluidos
- `src/ui/SegmentedHUDBar.js`
- `src/ui/ScoreHUD.js`
- `src/systems/HealthBarSystem.js`
- `src/scenes/GameScene.js`
- `src/config/GameSettings.js`

## Instalación
Ejecuta desde la raíz de Ninjuku, con el repositorio en la rama de pruebas G1:

```bash
# Antes: git status; no sobreescribas cambios propios sin revisarlos
unzip -o ~/Descargas/Ninjuku_G1_2_HUD_Optimizacion.zip -d ~/Escritorio/Ninjuku
npm run build
npm run dev
```

## Pruebas manuales necesarias
1. Pantalla 900x900 / 1366x768: comprobar que el panel de puntos no queda detrás de «Cuenta / Monedas».
2. Móvil 390x844 en emulación y pantalla horizontal: verificar que HUD, marcador y controles no se superponen.
3. Colgarse de madera 6 s: ~2 segmentos gastados; soltar 15 s: recuperar ~1 segmento.
4. Recoger corazón: solo sube vida, no energía.
5. Ganar puntos y recibir daño: animaciones del marcador y barras correctas.
6. Morir y reiniciar varias veces: no aparecen marcadores duplicados.
7. Abrir/cerrar «Cuenta / Monedas»: el marcador permanece visible y sin bloquear botones.

## Auditoría de bugs y rendimiento (sin cambios arriesgados)
- La escena principal sigue concentrando lógica de múltiples sistemas; refactorizar de manera incremental.
- El bundle Vite anteriormente reportó tamaño de ~1,55 MB sin gzip; medir carga inicial en Android real antes de dividir chunks.
- `Math.random()` en oleadas es aceptable en modo individual, pero no podrá ser fuente autoritativa en multijugador.
- El identificador de partida sigue usando un fallback pseudoaleatorio si no existe `crypto.getRandomValues()`. Para producción, exigir contexto seguro HTTPS y generación criptográfica; no usar identificadores inseguros para recompensas.
- La puntuación todavía se origina en cliente; el backend deberá validarla antes de adjudicar monedas.
- Safe areas nativas deben evaluarse durante G2 para Android/iOS. No se cambiaron las dimensiones del canvas en este parche.

## Verificación en el entorno de preparación
- `node --check` de los 5 archivos: correcto.
- Compilación Vite no ejecutable aquí: dependencias ausentes y `npm ci --offline` no pudo recuperar `vite@8.3.5` de caché. Ejecutar `npm run build` en tu equipo para confirmar.
- Prueba visual en navegador pendiente; la captura proporcionada sirvió de referencia, no como validación del nuevo código.
