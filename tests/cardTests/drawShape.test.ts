import { expect, test } from "vitest"
import type { Curve } from "../../src/cardBase/dataTypes"
import { dt } from "../../src/cardBase/dataTypes"
import { DrawShapes } from "../../src/cards/drawShapes"

// Mock a simple curve
class SimpleCurve {
    getValue(t: number): number[] {
        // Draw a simple circle: x = cos(t*2π), y = sin(t*2π)
        const angle = t * Math.PI * 2
        return [Math.cos(angle), Math.sin(angle)]
    }
}

test("DrawShapes throws error without shape", async () => {
    const card = new DrawShapes()

    const color = dt.color(1, 0, 0, 1)
    const position = dt.vector([100, 50])

    await expect(card.evaluate([color, position])).rejects.toThrow(
        "DrawShapes requires a shape input",
    )
})

test("DrawShapes throws error without color", async () => {
    const card = new DrawShapes()

    const shape = dt.shape([new SimpleCurve() as Curve])
    const position = dt.vector([100, 50])

    await expect(card.evaluate([shape, position])).rejects.toThrow(
        "DrawShapes requires a color input",
    )
})
