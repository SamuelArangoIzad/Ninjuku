# Ninjuku G1.3 — Estabilidad y pruebas

Base: ZIP original + parches G1, G1.1 y G1.2. Este ZIP es **incremental**: no sobrescribe el HUD aprobado.

## Corrección funcional
- Antes, `EnergyComponent.canHook()` devolvía true con cualquier fracción de segmento mayor que 0. Con 0.01 segmentos se podía volver a enganchar por un instante.
- Ahora exige >= 1 segmento completo para **iniciar** un enganche. Si ya está colgado, puede utilizar la energía restante, y se suelta al llegar a 0.
- Se preserva el drenaje de 1 segmento cada 3 segundos y la regeneración de 1 segmento cada 15 segundos sin engancharse.

## Pruebas agregadas
`npm test` usa el ejecutor incorporado de Node.js, sin dependencias de prueba adicionales. Ocho casos: inicio, drenaje, ausencia de regeneración colgado, fracción insuficiente, agotamiento, regeneración, reinicio del temporizador al reengancharse y saturación en la energía máxima.

## Auditoría estática: resultados y límites
- `WaveManager` rastrea y cancela sus temporizadores al destruirse: no se detectó una fuga en esta ruta.
- `GameScene`, `MenuScene` y `GameOverScene` retiran sus listeners de redimensionamiento en shutdown; Game Over también retira su listener del teclado.
- La escena principal contiene numerosas responsabilidades (refactorización incremental pendiente).
- La autenticación y las recompensas de Supabase aún dependen de una puntuación suministrada por el cliente, explícitamente indicado en `supabase/schema.sql`: **riesgo de abuso**, pendiente de servidor autoritativo / validación en G3/G5.
- Los tamaños del bundle y las métricas FPS/memoria necesitan medirse en navegadores y dispositivos reales: no se verificaron con este parche.
- Pruebas visuales y `vite build` deben ejecutarse en la máquina del usuario; no se afirma su validación aquí.

## Aplicación
Desde la raíz de Ninjuku en una rama G1 limpia o con G1.2 ya aplicado:

```bash
unzip -o ~/Descargas/Ninjuku_G1_3_Estabilidad_Pruebas.zip -d ~/Escritorio/Ninjuku
npm test
npm run build
npm run dev
```

En la partida: gastar energía hasta dejar menos de un segmento; soltarse y comprobar que no se permite un nuevo enganche hasta regenerar por lo menos un segmento.

No afecta a Supabase, puntuación, vida, escenas ni gráficos.
