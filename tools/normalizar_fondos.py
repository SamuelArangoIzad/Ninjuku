"""
Normaliza todos los fondos al tamano canonico del juego: 1600x900.

Varios fondos venian exportados a 1599x900. Esa diferencia de un pixel
obliga al motor a escalar cada fondo de forma ligeramente distinta, lo
que descuadra el encadenado de paneles del BackgroundManager.

La correccion NO reescala ni recorta la imagen: se repite la ultima
columna de pixeles hasta llegar al ancho objetivo. Asi el encuadre, la
altura del balcon y la posicion de todos los elementos quedan
exactamente donde estaban.

Uso:
    python tools/normalizar_fondos.py
    python tools/normalizar_fondos.py --carpeta public/assets/backgrounds
"""

import argparse
import glob
import os

from PIL import Image

ANCHO_OBJETIVO = 1600
ALTO_OBJETIVO = 900


def normalizar(ruta):
    with Image.open(ruta) as imagen:
        origen = imagen.convert("RGB")
        ancho, alto = origen.size

        if (ancho, alto) == (ANCHO_OBJETIVO, ALTO_OBJETIVO):
            return f"{os.path.basename(ruta):22s} ya estaba en 1600x900"

        if alto != ALTO_OBJETIVO or ancho > ANCHO_OBJETIVO:
            return (
                f"{os.path.basename(ruta):22s} OMITIDO: {ancho}x{alto} "
                f"no se puede ajustar repitiendo columnas"
            )

        destino = Image.new("RGB", (ANCHO_OBJETIVO, ALTO_OBJETIVO))
        destino.paste(origen, (0, 0))

        # Se repite la ultima columna en el hueco restante.
        ultima_columna = origen.crop((ancho - 1, 0, ancho, alto))

        for x in range(ancho, ANCHO_OBJETIVO):
            destino.paste(ultima_columna, (x, 0))

    destino.save(ruta, optimize=True)

    return (
        f"{os.path.basename(ruta):22s} {ancho}x{alto} -> "
        f"{ANCHO_OBJETIVO}x{ALTO_OBJETIVO} "
        f"(+{ANCHO_OBJETIVO - ancho} col. repetida)"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Deja todos los fondos en 1600x900 sin reescalar."
    )

    parser.add_argument(
        "--carpeta",
        default="public/assets/backgrounds",
        help="Carpeta con los PNG de fondo."
    )

    argumentos = parser.parse_args()

    rutas = sorted(
        glob.glob(os.path.join(argumentos.carpeta, "*.png"))
    )

    if not rutas:
        print(f"No se encontraron PNG en {argumentos.carpeta}")
        return

    for ruta in rutas:
        print(normalizar(ruta))


if __name__ == "__main__":
    main()
