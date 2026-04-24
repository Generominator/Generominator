// @vitest-environment jsdom
import { test, expect, vi } from "vitest"
import { ParametricFlower2D } from "../../src/cards/parametricFlower2D"
import { dt } from "../../src/cardBase/dataTypes"

test("returns an image", async () => {
    if (typeof Path2D === "undefined") {
        global.Path2D = vi.fn(
            class {
                rect = vi.fn()
                moveTo = vi.fn()
                lineTo = vi.fn()
                closePath = vi.fn()
                addPath = vi.fn()
                arc = vi.fn()
                arcTo = vi.fn()
                bezierCurveTo = vi.fn()
                ellipse = vi.fn()
                quadraticCurveTo = vi.fn()
                roundRect = vi.fn()
            },
        )
    }

    const flower = new ParametricFlower2D()

    const results = await flower.evaluate([
        dt.value(8),
        dt.value(3),
        dt.value(1.8),
    ])

    if (!("kind" in results[0])) {
        throw new Error("kind not in results")
    }

    expect(results[0].kind).toBe("image")
})
