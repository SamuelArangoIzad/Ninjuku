"""
Convierte los PNG sueltos del kusarigama en hojas de sprites uniformes.

EL PROBLEMA

Los frames vienen recortados uno a uno, cada cual con su tamano: de
80x158 a 291x222. Phaser necesita frames del mismo tamano, y ademas,
si se intercambian sin alinear, el ninja pega saltos en pantalla
porque cada recorte tiene su propia caja.

EL PUNTO DE REGISTRO

No es el mismo para todas las animaciones:

  balanceo    Es un pendulo. El punto fijo es la bola del extremo de
              la cadena, que es de donde cuelga el ninja. En "balanceo
              izquierda" la bola esta arriba a la derecha y el cuerpo
              se abre hacia la izquierda; en "balanceo derecha", al
              reves.

              Ojo: el kusarigama lleva DOS pesos, la bola y la hoz. En
              los ultimos frames los dos asoman por arriba, asi que
              hay que quedarse con el del lado del anclaje, no con el
              promedio de ambos.

  lanzamiento Los pies siguen plantados en el suelo mientras la cadena
  aterrizaje  sale hacia arriba, asi que el registro son los pies.

Alineando asi, al superponer los frames de balanceo las cadenas
convergen en un unico punto: es la comprobacion de que esta bien.

SALIDA

Una hoja horizontal por animacion en public/assets/player/generated/,
mas las constantes (tamano de frame y origen) para pegarlas en
src/entities/GrappleAnimations.js.

Uso:
    python tools/preparar_animaciones.py
"""

import glob
import json
import os
import re

from PIL import Image

ORIGEN = "public/assets/player"
DESTINO = "public/assets/player/generated"

# Opacidad minima para considerar que un pixel es dibujo.
ALFA = 40

# Filas desde el borde que se miran para localizar el punto de registro.
FILAS_BOLA = 18
FILAS_PIES = 14

# Anchura alrededor del extremo dentro de la que se promedia la bola.
# Evita mezclarla con la hoz, que asoma por el otro lado.
RADIO_BOLA = 26

# Referencia de tamano: el ninja normal.
REFERENCIA = "public/assets/player/ninja_idle.png"
REFERENCIA_FRAME = (0, 0, 128, 128)

# Una fila mas ancha que esto ya no es cadena ni brazo, es cuerpo.
# Sirve para medir el ninja de cabeza a botas ignorando la cadena.
UMBRAL_CUERPO = 45

# Frames que se usan para medir el tamano.
#
# Solo los primeros, que son las poses erguidas. En las poses
# horizontales o agachadas la distancia de cabeza a botas se
# comprime y la medida sale mas pequena de lo que es el dibujo.
FRAMES_PARA_MEDIR = 2

ANIMACIONES = [
    {
        "nombre": "kusarigama-launch",
        "carpeta": "launch_tool",
        "patron": "launch frame*.png",
        "registro": "pies"
    },
    {
        "nombre": "kusarigama-land",
        "carpeta": "aterrizajeSprites",
        "patron": "aterrizaje*.png",
        "registro": "pies"
    },
    {
        "nombre": "kusarigama-swing-left",
        "carpeta": "balanceo izquierda",
        "patron": "balanceoIzquierda*.png",
        "registro": "bola-derecha"
    },
    {
        "nombre": "kusarigama-swing-right",
        "carpeta": "balanceo derecha",
        "patron": "balanceoDerecha*.png",
        "registro": "bola-izquierda"
    },
    {
        # El shuriken gira sobre si mismo. El punto fijo es su eje, y
        # como la estrella es simetrica, el centroide de la parte
        # solida cae justo ahi. La estela de movimiento se descarta
        # subiendo el umbral de opacidad: si entrase en la cuenta,
        # tiraria del centro hacia un lado y el giro bailaria.
        "nombre": "shuriken",
        "carpeta": "shuriken movimiento",
        "patron": "shurikenFrame*.png",
        "registro": "centro"
    },
    {
        # Enemigo que lanza shuriken desde los tejados. No se mueve,
        # asi que el registro son los pies.
        #
        # "centrar" ensancha el lienzo hasta dejar los pies justo en
        # el medio. Hace falta porque el dibujo solo mira a la
        # derecha y hay que voltearlo para el otro lado: al reflejar,
        # un punto de registro descentrado se va al lado contrario y
        # el enemigo saltaria de sitio al girarse.
        "nombre": "soldier-shuriken",
        "carpeta": "../enemies/soldier_shuriken",
        "patron": "enemyShuriken*.png",
        "registro": "pies",
        "centrar": True
    },
    {
        # Ojo con el nombre: los archivos de "hurt" vienen con la
        # erre antes de la i ("solider"), al reves que los demas.
        "nombre": "soldier-shuriken-hurt",
        "carpeta": "../enemies/soldier_shuriken/soldierShuriken_hurt",
        "patron": "soliderShuriken_hurt*.png",
        "registro": "pies",
        "centrar": True
    },
    {
        "nombre": "soldier-shuriken-death",
        "carpeta": "../enemies/soldier_shuriken/soldierShuriken_death",
        "patron": "soldierShuriken_death*.png",
        "registro": "pies",
        "centrar": True
    }
]


def alto_cuerpo(imagen):
    """Alto del ninja de cabeza a botas, sin contar la cadena."""
    alfa = imagen.split()[3].load()
    ancho, alto = imagen.size

    anchos = [
        sum(1 for x in range(ancho) if alfa[x, y] > ALFA)
        for y in range(alto)
    ]

    arriba = next(
        (y for y, v in enumerate(anchos) if v >= UMBRAL_CUERPO),
        None
    )

    if arriba is None:
        return None

    abajo = max(y for y, v in enumerate(anchos) if v > 0)

    return abajo - arriba + 1


def alto_referencia():
    with Image.open(REFERENCIA) as archivo:
        frame = archivo.convert("RGBA").crop(REFERENCIA_FRAME)

    return alto_cuerpo(frame)


def numero(ruta):
    return int(re.findall(r"(\d+)", os.path.basename(ruta))[-1])


def opacos(alfa, ancho, alto):
    return [
        (x, y)
        for y in range(alto)
        for x in range(ancho)
        if alfa[x, y] > ALFA
    ]


def registro_bola(alfa, ancho, alto, lado):
    arriba = next(
        y for y in range(alto)
        if any(alfa[x, y] > ALFA for x in range(ancho))
    )

    puntos = [
        (x, y)
        for y in range(arriba, min(alto, arriba + FILAS_BOLA))
        for x in range(ancho)
        if alfa[x, y] > ALFA
    ]

    borde = (
        max(p[0] for p in puntos)
        if lado == "derecha"
        else min(p[0] for p in puntos)
    )

    bola = [
        p for p in puntos
        if abs(p[0] - borde) <= RADIO_BOLA
    ]

    return (
        sum(p[0] for p in bola) / len(bola),
        sum(p[1] for p in bola) / len(bola)
    )


# Opacidad minima para contar como parte solida, descartando estelas.
ALFA_SOLIDO = 200


def registro_centro(alfa, ancho, alto):
    """Centroide de la parte solida: el eje de giro de un objeto simetrico."""
    puntos = [
        (x, y)
        for y in range(alto)
        for x in range(ancho)
        if alfa[x, y] > ALFA_SOLIDO
    ]

    if not puntos:
        return (ancho / 2, alto / 2)

    return (
        sum(p[0] for p in puntos) / len(puntos),
        sum(p[1] for p in puntos) / len(puntos)
    )


def registro_pies(alfa, ancho, alto):
    abajo = max(
        y for y in range(alto)
        if any(alfa[x, y] > ALFA for x in range(ancho))
    )

    puntos = [
        (x, y)
        for y in range(max(0, abajo - FILAS_PIES + 1), abajo + 1)
        for x in range(ancho)
        if alfa[x, y] > ALFA
    ]

    return (
        sum(p[0] for p in puntos) / len(puntos),
        sum(p[1] for p in puntos) / len(puntos)
    )


def preparar(anim):
    carpeta = os.path.join(ORIGEN, anim["carpeta"])
    rutas = sorted(
        glob.glob(os.path.join(carpeta, anim["patron"])),
        key=numero
    )

    if not rutas:
        return None

    numeros = [numero(r) for r in rutas]
    huecos = [
        n for n in range(min(numeros), max(numeros) + 1)
        if n not in numeros
    ]

    piezas = []
    altos = []
    for ruta in rutas:
        with Image.open(ruta) as archivo:
            imagen = archivo.convert("RGBA")

        alfa = imagen.split()[3].load()

        if anim["registro"] == "pies":
            ancla = registro_pies(alfa, imagen.width, imagen.height)
        elif anim["registro"] == "centro":
            ancla = registro_centro(alfa, imagen.width, imagen.height)
        else:
            lado = anim["registro"].split("-")[1]
            ancla = registro_bola(
                alfa, imagen.width, imagen.height, lado
            )

        # Los pies sirven de referencia para el cuerpo fisico: el
        # sprite del jugador tiene su origen abajo, en los pies.
        pies = registro_pies(alfa, imagen.width, imagen.height)

        medida = (
            None
            if anim["registro"] == "centro"
            else alto_cuerpo(imagen)
        )

        if medida:
            altos.append(medida)

        piezas.append((imagen, ancla, pies))

    # Lienzo comun: el que cabe a todos una vez alineados por el ancla.
    izq = max(a[0] for _, a, _ in piezas)
    der = max(im.width - a[0] for im, a, _ in piezas)

    if anim.get("centrar"):
        izq = der = max(izq, der)
    arr = max(a[1] for _, a, _ in piezas)
    aba = max(im.height - a[1] for im, a, _ in piezas)

    ancho = int(round(izq + der))
    alto = int(round(arr + aba))

    hoja = Image.new(
        "RGBA",
        (ancho * len(piezas), alto),
        (0, 0, 0, 0)
    )

    for indice, (imagen, (ax, ay), _) in enumerate(piezas):
        hoja.paste(
            imagen,
            (
                (indice * ancho) + int(round(izq - ax)),
                int(round(arr - ay))
            ),
            imagen
        )

    os.makedirs(DESTINO, exist_ok=True)
    salida = os.path.join(DESTINO, anim["nombre"] + ".png")
    hoja.save(salida, optimize=True)

    # Desplazamiento del ancla a los pies, en pixeles del frame.
    # Con el, el cuerpo fisico del jugador puede seguir al dibujo.
    pies_desde_ancla = [
        [round(px - ax, 1), round(py - ay, 1)]
        for _, (ax, ay), (px, py) in piezas
    ]

    # Cada animacion viene dibujada a su propio tamano. Si se aplica
    # una sola escala a todas, la que este dibujada mas grande sale
    # desproporcionada en pantalla. Se mide contra el ninja normal.
    referencia = alto_referencia()

    medibles = altos[:FRAMES_PARA_MEDIR]

    proporcion = (
        (sum(medibles) / len(medibles)) / referencia
        if medibles and referencia else 1
    )

    return {
        "feetOffsets": pies_desde_ancla,
        "proporcion": round(proporcion, 3),
        "artScale": round(1 / proporcion, 3) if proporcion else 1,
        "nombre": anim["nombre"],
        "archivo": salida,
        "frames": len(piezas),
        "frameWidth": ancho,
        "frameHeight": alto,
        "originX": round(izq / ancho, 4),
        "originY": round(arr / alto, 4),
        "huecos": huecos,
        "memoria_mb": round(
            ancho * alto * 4 * len(piezas) / 1024 / 1024, 2
        )
    }


def main():
    resultados = []

    for anim in ANIMACIONES:
        info = preparar(anim)

        if not info:
            print(f"Sin frames para {anim['nombre']}")
            continue

        resultados.append(info)

        aviso = (
            f"   AVISO: faltan los numeros {info['huecos']}"
            if info["huecos"] else ""
        )

        print(
            f"{info['nombre']:24s} {info['frames']:2d} frames  "
            f"{info['frameWidth']}x{info['frameHeight']}  "
            f"origin=({info['originX']}, {info['originY']})  "
            f"tamano x{info['proporcion']} -> artScale {info['artScale']}  "
            f"{info['memoria_mb']} MB{aviso}"
        )

    total = sum(r["memoria_mb"] for r in resultados)
    print(f"\nMemoria total de textura: {total:.1f} MB")

    print(
        "Aviso: artScale se mide de cabeza a botas en poses "
        "erguidas. Para el aterrizaje no vale, porque todos sus "
        "frames son en el aire o en cuclillas: usa el mismo que "
        "el lanzamiento, que sale del mismo juego de dibujos."
    )

    print("\nConstantes para GrappleAnimations.js:")
    print(json.dumps(
        {
            r["nombre"]: {
                "frames": r["frames"],
                "frameWidth": r["frameWidth"],
                "frameHeight": r["frameHeight"],
                "originX": r["originX"],
                "originY": r["originY"],
                "artScale": r["artScale"],
                "feetOffsets": r["feetOffsets"]
            }
            for r in resultados
        },
        indent=4
    ))


if __name__ == "__main__":
    main()
