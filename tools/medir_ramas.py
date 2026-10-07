"""
Detecta las ramas de cerezo en la franja superior de cada fondo y
propone puntos de anclaje para colgar el objeto.

Lo distintivo de la rama no es que sea oscura (los pinos tambien lo
son) sino las flores: rosa muy claro, con el azul alto. El cielo del
atardecer y las nubes son naranjas, con el azul hundido.

  flor   luminancia > 185  y  R - B < 35   (medido: lum 202-215, R-B 9-24)
  cielo  luminancia ~ 145  y  R - B > 65   (medido: R-B 67-128)

Una columna cuenta como rama solo si tiene flores cerca. Asi los pinos
de fondo6 y fondo7 quedan descartados.
Uso:
    python tools/medir_ramas.py
    SALIDA_RAMAS=<carpeta> python tools/medir_ramas.py   # guarda verificacion
"""
import os
from PIL import Image, ImageDraw

BG = "public/assets/backgrounds/"
# Las imagenes de verificacion solo se escriben si se pide una
# carpeta. Por defecto no se genera ninguna: con "." acababan
# ensuciando la raiz del repositorio.
OUT = os.environ.get("SALIDA_RAMAS")

ZONA = 300           # franja superior que se analiza
FLOR_LUM = 172
FLOR_RB = 45
RAMA_LUM = 60        # madera oscura
VENTANA = 45         # radio para buscar flores alrededor de una columna
MIN_FLORES = 12      # flores en la ventana para considerar rama de cerezo
SEPARACION = 420     # separacion minima entre anclajes, en px de origen

# La tabla del objeto ocupa estas filas de su sprite (142 px de ancho).
TABLA_Y0, TABLA_Y1, TABLA_ANCHO = 108, 150, 142

# Si la tabla cae sobre tanto edificio, el anclaje se descarta: el
# objeto taparia un templo en vez de colgar sobre el cielo.
#
# El umbral es alto a proposito. Solo busca cazar el caso flagrante
# (un tablon posado entero sobre un tejado, que se medio en un 98.7%).
# Rozar un alero de lejos no molesta, y bajarlo mucho hace que el
# anclaje salte varios pixeles por nada.
MAX_EDIFICIO = 60    # porcentaje
EDIFICIO_LUM = 95    # por debajo de esto se cuenta como tejado
MAX_ANCLAS = 2

NOMBRES = {1: "fondo.png"}
for i in range(2, 9):
    NOMBRES[i] = f"fondo{i}.png"


def tapa_edificio(px, ancho, ax, ay):
    """Porcentaje de tejado que quedaria debajo de la tabla."""
    x0, x1 = max(0, ax - TABLA_ANCHO // 2), min(ancho, ax + TABLA_ANCHO // 2)
    y0, y1 = ay + TABLA_Y0, min(900, ay + TABLA_Y1)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    total = oscuros = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            total += 1
            if 0.299 * r + 0.587 * g + 0.114 * b < EDIFICIO_LUM:
                oscuros += 1
    return oscuros / total * 100


def analizar(ruta):
    with Image.open(ruta) as im:
        img = im.convert("RGB")
    w, _ = img.size
    px = img.load()

    flor = [[False] * w for _ in range(ZONA)]
    masa = [[False] * w for _ in range(ZONA)]
    for y in range(ZONA):
        for x in range(w):
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            es_flor = lum > FLOR_LUM and (r - b) < FLOR_RB
            flor[y][x] = es_flor
            masa[y][x] = es_flor or lum < RAMA_LUM

    flores_col = [sum(1 for y in range(ZONA) if flor[y][x]) for x in range(w)]
    fondo_de = [
        max((y for y in range(ZONA) if masa[y][x]), default=-1)
        for x in range(w)
    ]

    cerca = []
    for x in range(w):
        a, b = max(0, x - VENTANA), min(w, x + VENTANA + 1)
        cerca.append(sum(flores_col[a:b]))

    es_rama = [c >= MIN_FLORES for c in cerca]
    cobertura = sum(es_rama) / w * 100

    candidatos = sorted(
        (x for x in range(w) if es_rama[x] and fondo_de[x] > 0),
        key=lambda x: -cerca[x]
    )
    anclas = []
    descartados = []
    for x in candidatos:
        if any(abs(x - a[0]) < SEPARACION for a in anclas):
            continue
        y = fondo_de[x]
        tapado = tapa_edificio(px, w, x, y)
        if tapado > MAX_EDIFICIO:
            descartados.append((x, round(tapado, 1)))
            continue
        anclas.append((x, y, cerca[x]))
        if len(anclas) >= MAX_ANCLAS:
            break
    anclas.sort()
    return anclas, cobertura, es_rama, descartados


tabla = {}
for i in range(1, 9):
    ruta = BG + NOMBRES[i]
    anclas, cobertura, es_rama, descartados = analizar(ruta)
    tabla[i] = anclas
    det = "  ".join(
        f"x={x} colgar_y={y} flores={f}" for x, y, f in anclas
    ) or "SIN RAMAS"
    aviso = ""
    if descartados:
        peores = sorted(descartados, key=lambda d: -d[1])[:3]
        aviso = (
            f"  [descartados por tapar edificio: {len(descartados)} columnas, "
            + ", ".join(f"x={x} ({t}%)" for x, t in peores) + "]"
        )
    print(f"fondo{i}: rama en {cobertura:5.1f}% del ancho | {det}{aviso}")

    if not OUT:
        continue

    with Image.open(ruta) as im:
        vis = im.convert("RGB").crop((0, 0, 1600, ZONA + 120))
    d = ImageDraw.Draw(vis)
    for x in range(1600):
        if es_rama[x]:
            d.point((x, 2), fill=(0, 255, 90))
            d.point((x, 3), fill=(0, 255, 90))
    for x, y, _ in anclas:
        d.line([(x, 0), (x, y)], fill=(255, 220, 0), width=3)
        d.ellipse([x - 10, y - 10, x + 10, y + 10], outline=(255, 220, 0), width=4)
    vis.resize((800, (ZONA + 120) * 800 // 1600)).save(
        os.path.join(OUT, f"anclas_{i}.png")
    )

print("\nTabla para el codigo:")
for i, anclas in tabla.items():
    pares = ", ".join(f"{{ x: {x}, y: {y} }}" for x, y, _ in anclas)
    print(f'    "background-{i}": [{pares}],')
