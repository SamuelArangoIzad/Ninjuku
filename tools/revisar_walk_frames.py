from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent

FRAMES_DIR = (
    ROOT
    / "public"
    / "assets"
    / "enemies"
    / "soldier"
    / "frames"
    / "soldier_walk"
)


def main() -> None:
    for index in range(8):
        frame_name = f"frame_{index:02d}.png"
        frame_path = FRAMES_DIR / frame_name

        if not frame_path.exists():
            print(
                f"[ERROR] No existe: {frame_path}"
            )
            continue

        image = Image.open(frame_path).convert("RGBA")

        alpha = image.getchannel("A")
        bounds = alpha.getbbox()

        print(
            f"{frame_name}: "
            f"size={image.size}, "
            f"visible_bounds={bounds}"
        )


if __name__ == "__main__":
    main()