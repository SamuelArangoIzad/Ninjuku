# Ninjuku G1.4 — Rotulación japonesa del HUD y las rondas

Parche incremental sobre G1.3. No cambia vida, energía, combate, oleadas, puntuación ni backend.

## Cambios
- Vida: `体力 · VIDA`
- Energía: `気力 · ENERGÍA`
- Puntaje: `得点 · PUNTAJE` (sin alterar el valor ni animaciones)
- Rondas: `第一波 · RONDA 1`, `第二波 · RONDA 2`, ... `第十波 · RONDA 10`
- Fin de rondas: `達成 · ¡COMPLETADO!`
- Texto del anuncio se adapta al ancho disponible.
- Fuentes japonesas del sistema con alternativas: Noto Sans CJK JP, Yu Gothic, Hiragino; si el sistema carece de glifos japoneses, podrían aparecer sustitutos. Para el lanzamiento móvil habrá que incorporar una fuente CJK con licencia verificable.

## Archivos
- `src/ui/SegmentedHUDBar.js`
- `src/ui/ScoreHUD.js`
- `src/ui/RoundBanner.js`
- `src/ui/japaneseLabels.js` (nuevo)
- `tests/japaneseLabels.test.js` (nuevo)

## Instalación (Kali/Linux)
Desde la raíz de Ninjuku y con G1.3 aplicado:

```bash
# Verifica antes de sobrescribir cambios propios
 git status
 unzip -o ~/Descargas/Ninjuku_G1_4_Textos_Japoneses.zip -d ~/Escritorio/Ninjuku
 npm test
 npm run build
 npm run dev
```

## Pruebas manuales
1. Verificar `体力 · VIDA` y `気力 · ENERGÍA` sin desalineación de barras.
2. Confirmar que `得点 · PUNTAJE` aparece completo y que el marcador incrementa al eliminar enemigos.
3. Validar el anuncio de rondas 1, 2, 3 y 10; verificar que los textos no se corten.
4. Probar al cambiar el ancho de ventana y desde la IP local en un teléfono.
5. Confirmar que las pruebas de energía G1.3 siguen pasando y que el enganche y regeneración no cambian.

## Alcance de validación
Se ejecutaron comprobaciones de sintaxis JavaScript y cuatro pruebas unitarias del formato bilingüe. La compilación con Vite y la visualización en navegador quedan por validar en el equipo de desarrollo.
