# Ninjuku G1.9.1 — Soportes y controles responsive

## Alcance

- Pilar de madera desplazado de 94 a 174 unidades locales a la derecha del punto de anclaje, con viga extendida, refuerzo diagonal, remates y base de piedra. Sigue el fondo por `HangingSupportVisual`, sin añadir hitboxes ni modificar `HangingPropManager` / `HookRegistry`.
- Botones de acción más pequeños, separados y redimensionados a partir de la altura y el ancho reales del canvas; se conservan △ shuriken, □ ataque, ○ salto, × correr y las flechas de movimiento.
- El área interactiva original se escala con los botones y conserva margen extra alrededor del círculo visible.
- Geometría y cálculos de layout extraídos a módulos puros con pruebas unitarias.

## Aplicación

Desde la carpeta `Ninjuku`:

```bash
# Antes de aplicar, asegurarse de tener un árbol limpio o respaldar los cambios
# y estar en una rama de trabajo desde main.
unzip -o ~/Descargas/Ninjuku_G1_9_1_Soportes_Controles.zip -d .
npm test
npm run build
npm run dev
```

## Comprobaciones

1. En horizontal 780x360, 915x412, 932x430 y 1180x820: todos los botones visibles sin traslape, uniformes y alcanzables.
2. Moverse mientras se pulsa △ y comprobar que se lanza shuriken.
3. Colgarse de ambos soportes a la vez que pasa el panorama: la viga conecta a la argolla y el pilar no se confunde con la cuerda.
4. Después de cambiar el tamaño de pantalla, validar que el soporte llega a la superficie y no altera el enganche ni los corazones.

## Verificación local de preparación

- `node --test tests/*.test.js`: 27/27 correctas.
- `node --check` de archivos nuevos y modificados: correcto.
- `npm run build`: pendiente en el equipo de desarrollo; el entorno de preparación no tiene Vite instalado.

No modifica Supabase ni las reglas de vida, energía, oleadas o puntuación.
