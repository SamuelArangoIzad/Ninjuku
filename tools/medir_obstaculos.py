"""
Mide la caja solida de cada estructura de obstaculo.

Los PNG tienen margenes transparentes, remates finos (la aguja de la
pagoda) y algunas motas de pixeles sueltas flotando sobre el dibujo.
Si la colision usara el recuadro completo de la imagen, el jugador
chocaria contra el aire y aterrizaria sobre nada.

Esta herramienta calcula, para cada estructura:

  left / right  huella horizontal, medida sobre la mitad inferior del
                dibujo, que es la masa que debe bloquear el paso.
  top           primera fila cuyo ancho opaco alcanza el 25% del ancho
                maximo. Ese umbral descarta las motas sueltas y las
                agujas, y deja como superficie el tejado solido.

La salida se copia a OBSTACLE_SHAPES en src/world/ObstacleManager.js.

Uso:
    python tools/medir_obstaculos.py
"""

import argparse
import os

from PIL import Image

CARPETA = (
    "public/assets/platformsGameplay/PlatformSprites/"
    "row-5-EstructuresToUse"
)

# Opacidad minima para considerar que un pixel forma parte del dibujo.
UMBRAL_ALFA = 40

# Fraccion del ancho maximo que marca el tejado solido.
UMBRAL_TECHO = 0.25

# Solo se mira por debajo de esta fraccion de la altura para la huella.
INICIO_HUELLA = 0.55


def medir(ruta):
    with Image.open(ruta) as imagen:
        rgba = imagen.convert("RGBA")
        ancho, alto = rgba.size
        alfa = rgba.split()[3].load()

        filas = []

        for y in range(alto):
            columnas = [
                x
                for x in range(ancho)
                if alfa[x, y] > UMBRAL_ALFA
            ]

            filas.append(columnas)

    ancho_maximo = max(len(c) for c in filas)

    techo = next(
        y
        for y, c in enumerate(filas)
        if len(c) >= UMBRAL_TECHO * ancho_maximo
    )

    inferiores = [
        c
        for y, c in enumerate(filas)
        if y > alto * INICIO_HUELLA and c
    ]

    izquierda = min(c[0] for c in inferiores)
    derecha = max(c[-1] for c in inferiores)

    return {
        "frameWidth": ancho,
        "frameHeight": alto,
        "left": izquierda,
        "right": derecha,
        "top": techo
    }


def main():
    parser = argparse.ArgumentParser(
        description="Mide las cajas solidas de los obstaculos."
    )

    parser.add_argument(
        "--carpeta",
        default=CARPETA,
        help="Carpeta con los PNG de estructuras."
    )

    parser.add_argument(
        "--escala",
        type=float,
        default=0.47,
        help="Escala con la que se dibujan en el juego."
    )

    argumentos = parser.parse_args()

    for indice in range(1, 7):
        ruta = os.path.join(
            argumentos.carpeta,
            f"estructure{indice}.png"
        )

        if not os.path.exists(ruta):
            print(f"No existe {ruta}")
            continue

        forma = medir(ruta)

        altura_juego = (
            forma["frameHeight"] - forma["top"]
        ) * argumentos.escala

        print(
            f'    "obstacle-{indice}": {{ '
            f'frameWidth: {forma["frameWidth"]}, '
            f'frameHeight: {forma["frameHeight"]}, '
            f'left: {forma["left"]}, '
            f'right: {forma["right"]}, '
            f'top: {forma["top"]} }},'
            f'   // altura en juego: {altura_juego:.0f} px'
        )


if __name__ == "__main__":
    main()
