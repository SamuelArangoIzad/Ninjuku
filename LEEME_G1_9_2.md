# Ninjuku G1.9.2 — Ajustes de proporción

Base: G1.9.1. Parche incremental. No elimina ni reemplaza controles, sprites ni escenas.

- Botones de acción compactos: diámetro 28–34 px; distancia entre centros 38–47 px según altura del canvas.
- Conserva shuriken en triángulo; correr X; atacar cuadrado; saltar círculo.
- Soporte del tablón: madera con ménsula diagonal al extremo del obstáculo y poste a 132 unidades locales, iniciando a la altura del tablón (en vez de extenderse desde la parte alta de la imagen).
- Los puntos panorámicos se reducen a uno por segmento (3 en el ciclo) sobre anclajes previamente existentes, con separaciones de 1670–1940 px en el arte maestro. Esto disminuye la frecuencia de enganches y potencialmente de objetos vinculados: revisar balance de corazones y multiplicadores.
- No altera las reglas de daño, energía ni la posición interna de los ganchos conservados.

## Aplicación

```bash
cd ~/Escritorio/Ninjuku
git status
git switch -c NINJUKU_G1_9_2_AJUSTES
unzip -o ~/Descargas/Ninjuku_G1_9_2_Ajustes_Visuales.zip -d ~/Escritorio/Ninjuku
npm test
npm run build
npm run dev
```

Realizar un respaldo o commit si existen cambios sin confirmar antes de descomprimir.

## Comprobación
- Probar 915×412 y 780×360 en horizontal.
- Confirmar que los cuatro botones se pueden pulsar simultáneamente con movimiento.
- Verificar que el extremo del tablón se une visualmente al brazo de soporte y que no tapa el ninja.
- Recorrer todo el ciclo y comprobar frecuencia y accesibilidad de enganches, corazones y multiplicadores.

## Validación local
- 32/32 pruebas Node aprobadas; sintaxis JS correcta.
- Compilación de Vite no ejecutada aquí: no está instalado en el entorno de preparación.
