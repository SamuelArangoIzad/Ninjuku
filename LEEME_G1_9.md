# Ninjuku G1.9 — Soportes y cruceta móvil

## Base
Este parche fue preparado sobre `Ninjuku_G1_9_Estructuras_Controles.tar.gz` (tras merge de G1.8-B).

## Cambios
- `HangingSupportVisual.js`: soporte de madera con poste hasta la superficie del puente, viga y herrajes. Se recicla con cada plataforma y solo repinta al cambiar su geometría. Es decorativo, no añade colisión.
- `HangingPropManager.js`: enlaza un soporte por imagen reutilizada, mueve y oculta ambos simultáneamente. No modifica ID ni posición de los hooks.
- `Controls.js` y `actionLayout.js`: cruceta derecha △ (shuriken), □ (atacar), ○ (saltar), × (correr), con símbolos geométricos uniformes. Tecla K para shuriken.
- `GrappleController.js`: triángulo/K permite shuriken mientras se balancea; conserva también el ataque anterior con J mientras cuelga.
- `GameScene.js`: triángulo/K también lanza shuriken desde el suelo con cooldown de 220 ms; no dispara durante el lanzamiento/aterrizaje del kusarigama.
- `tests/actionLayout.test.js`: cuatro pruebas de disposición táctil.

## Instalación
Desde Kali Linux, rama nueva creada desde main actualizado:
```bash
cd ~/Escritorio/Ninjuku
git status
git switch -c NINJUKU_G1_9_ESTRUCTURAS_CONTROLES
unzip -o ~/Descargas/Ninjuku_G1_9_Estructuras_Controles_Parche.zip -d ~/Escritorio/Ninjuku
npm test
npm run build
npm run dev
```

## Pruebas pendientes en navegador
1. Comprobar que los postes se apoyen en el suelo (puente) y que sigan la plataforma durante scroll y resize; revisar visualmente que no tapen enemigos y controles.
2. Comprobar que los seis anclajes panorámicos siguen accesibles y que el ninja no atraviesa la estructura gráfica (el poste es decorativo, por diseño no colisiona).
3. Comprobar los cuatro botones a 780x360, 915x412 y 932x430; contraste y pulsaciones simultáneas.
4. Pulsar triángulo con el ninja en suelo: lanza shuriken, respeta cooldown. Pulsar colgado inclinado: lanza en dirección del balanceo.
5. Confirmar ○ salto, □ golpe, × correr y reinicio Game Over.

## Verificación disponible
- 20/20 tests de Node.js correctos en la copia de trabajo (16 previos + 4 nuevos).
- Sintaxis Node de todos los archivos JS modificados correcta.
- Compilación Vite y visualización Phaser todavía requieren `npm run build` y `npm run dev` en tu equipo.

No modifica base de datos, fondos panorámicos ni colisiones del kusarigama. No subir directo a main antes de probar.
