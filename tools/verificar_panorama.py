from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "public/assets/backgrounds/panorama"
master = Image.open(root / "ninjuku_panorama_master.webp").convert("RGB")
assert master.size == (5400, 900)
tiles = [Image.open(root / f"panorama{i}.webp").convert("RGB") for i in (1, 2, 3)]
assert all(tile.size == (1800, 900) for tile in tiles)
for i, tile in enumerate(tiles):
    original = master.crop((i * 1800, 0, (i + 1) * 1800, 900))
    assert tile.tobytes() == original.tobytes(), f"Tramo {i+1} no coincide"
assert all(tiles[-1].getpixel((1799, y)) == tiles[0].getpixel((0, y)) for y in range(900))
print("OK: 3 segmentos exactos y cierre cíclico sin costura de píxeles")
