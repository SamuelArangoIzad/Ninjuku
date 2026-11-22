# Ninjuku G1 — Ajuste de energía y HUD

Parche incremental: aplicar después del parche inicial G1. Incluye únicamente tres archivos.

- `src/components/EnergyComponent.js`: consumo continuo de energía (visualmente perceptible), 1 segmento de 3 s de enganche, regeneración de 1 segmento por cada 15 s fuera del enganche.
- `src/ui/SegmentedHUDBar.js`: iconos sin recuadros opacos y segmentos sin fondos negros.
- `src/scenes/GameScene.js`: energía desplazada de y=59 a y=83 para mayor separación respecto a vida.

Para aplicar: `unzip -o Ninjuku_G1_Ajuste_Energia_HUD.zip -d ~/Escritorio/Ninjuku`.
Probar `npm run build` y `npm run dev` en su equipo.

Los objetos de madera superiores están registrados a través de HangingPropManager/HookRegistry y su agarre en GrappleController. El consumo se activa durante el estado HOOKED (después de terminar la animación de subida). En el estado LAUNCHING no se consume energía.

Se verificaron sintaxis JavaScript y pruebas unitarias de lógica energética. No se completó compilación Vite en el entorno de preparación porque faltaba el ejecutable Vite.
