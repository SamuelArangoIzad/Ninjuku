# Ninjuku G1.5 — HUD móvil y transición de fondos

## G1.5-A — HUD

- Vida y energía escalan según la altura y anchura reales del canvas, sin alterar el valor de la vida ni de la energía.
- Ambos indicadores conservan una distancia vertical proporcional al tamaño del HUD.
- El marcador se escala y posiciona a la derecha por debajo de Cuenta/Monedas.
- El aviso de ronda adapta su tipografía tanto al ancho como al alto; mantiene los textos japoneses de G1.4.
- En los cambios de tamaño, GameScene reposiciona el HUD de energía.

## G1.5-B — Transición de fondos (parcial)

- Se suaviza la curva de mezcla entre imágenes existentes de cuatro a dos pasadas de smoothstep.
- Se preservan los paneles, los identificadores de fondo y las posiciones usadas por los enganches y obstáculos.
- **No se garantiza una unión invisible:** las imágenes son escenas distintas y el paquete de código previo no incluye los PNG de `public/assets/backgrounds`. Para conseguir el scrolling lateral continuo real hay que preparar capas repetibles que hagan match en ambos bordes y verificar la ubicación de colgantes en cada imagen.
- No se introdujo parallax multicapa por faltar esas capas de arte; no se debe simular parallax moviendo arbitrariamente los colgantes existentes.

## Instalación

Hacer backup o commit de la rama G1; descomprimir sobre raíz Ninjuku.

```bash
npm test
npm run build
npm run dev
```

Pruebas: móvil horizontal 915×412, 780×360, escritorio; rotación/redimensionamiento; comprobar menús y enganches. En imágenes: identificar la franja entre fondos, confirmar si hay menos corte y detectar duplicación de árboles o tejados.

## Para G1.5-B definitiva

Proporcionar `public/assets/backgrounds/fondo1.png` ... `fondo8.png` y, si existen, sus capas fuente sin comprimir. Se requiere rediseñar el material artístico repetible y el sistema de capas en una iteración separada.
