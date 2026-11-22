# G1.9.3 — Soportes correctamente suspendidos y pasarela de madera

- `HangingSupportVisual`: ahora el brazo superior llega a la argolla donde comienza la cuerda, en lugar de sostener el tablón desde un brazo inferior.
- `hangingSupportGeometry`: sin modificación de los anclajes físicos, separación entre colgantes o consumo de energía.
- `Ground`: dibuja una pasarela de tablones que ocupa exactamente la altura del suelo físico existente. No añade colisiones.
- `woodenWalkwayLayout`: geometría pura verificable.
- `GameScene`: llama a `ground.update(delta)` para desplazar las vetas y uniones al ritmo de 35 px/s del fondo.
- Controles: no se modificaron. Mantiene G1.9.2.

Instalación encima de G1.9.2. Verificar `npm test`, `npm run build` y `npm run dev`.

Revisar vista móvil 915x412 y 780x360: plataforma bajo los pies; anilla conectada al brazo superior; enganche, salto, shuriken y ausencia de errores de consola. El acabado gráfico es programático y se puede afinar tras captura.
