/** Parámetros puros de la pasarela. Su borde coincide con el suelo físico. */
export function getWalkwayLayout(screenWidth, screenHeight, floorHeight, bottomMargin = 0) {
    const width = Math.max(1, Math.floor(screenWidth));
    const height = Math.max(1, Math.floor(screenHeight));
    const floor = Math.max(1, Math.floor(floorHeight));
    const margin = Math.max(0, Math.floor(bottomMargin));
    return {
        width, height,
        surfaceY: height - margin - floor,
        boardHeight: floor,
        boardLength: 66
    };
}
