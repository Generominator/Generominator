import { test, expect } from "vitest"
import { DeCasteljauAlgorithmCard } from "../../src/cards/deCasteljauAlgorithm"
import { dt, DataTypeOf } from "../../src/cardBase/dataTypes"
import { BezierCurve } from "../../src/cards/createCurves"

test("DeCasteljau card ports are correct", () => {
    const card = new DeCasteljauAlgorithmCard()
    expect(card.inputs[0].label).toBe("curve")
    expect(card.inputs[1].label).toBe("sample rate")
    expect(card.inputs[2].label).toBe("sample pos")

    expect(card.outputs[0].label).toBe("points")
    expect(card.outputs[1].label).toBe("tangents")
    expect(card.outputs[2].label).toBe("accelerations")
})

test("Calculates correct point and tangent at t = 0", async () => {
    const curve = new BezierCurve(
        [
            [0, 0],
            [10, 10],
            [20, 10],
            [30, 0],
        ],
        4,
    )
    const card = new DeCasteljauAlgorithmCard()

    const results = await card.evaluate([
        dt.curve(curve),
        dt.value(0),
        dt.value(0),
    ])

    const points = (results[0] as DataTypeOf<"vector">).value.components
    const tangents = (results[1] as DataTypeOf<"vector">).value.components

    // At t = 0, point should be first control point -> (0,0)
    expect(points).toEqual([0, 0])

    // At t = 0 for cubic, tangent is 3 * (P1 - P0) -> 3 * ([10, 10] - [0, 0]) = [30, 30]
    expect(tangents).toEqual([30, 30])
})

test("Calculates correct acceleration for a quadratic curve", async () => {
    const curve = new BezierCurve(
        [
            [0, 0],
            [10, 20],
            [20, 0],
        ],
        3,
    )
    const card = new DeCasteljauAlgorithmCard()

    // Sample at midpoint
    const results = await card.evaluate([
        dt.curve(curve),
        dt.value(0),
        dt.value(0.5),
    ])

    const accels = (results[2] as DataTypeOf<"vector">).value.components

    // Acceleration is constant for quadratic: 2 * (P2 - (2 * P1) + P0)
    // X: 2 * (20 - 2 * 10 + 0) = 0
    // Y: 2 * (0 - 2 * 20 + 0) = -80
    expect(accels).toEqual([0, -80])
})

test("Samples multiple points when sample rate > 1", async () => {
    const curve = new BezierCurve(
        [
            [0, 0],
            [10, 10],
            [20, 10],
            [30, 0],
        ],
        4,
    )
    const card = new DeCasteljauAlgorithmCard()
    const sampleRate = 67 // :)

    const results = await card.evaluate([
        dt.curve(curve),
        dt.value(sampleRate),
        dt.value(0),
    ])

    const points = (results[0] as DataTypeOf<"vector">).value.components
    const tangents = (results[1] as DataTypeOf<"vector">).value.components

    // 2 components (x,y) per sample
    expect(points.length).toBe(sampleRate * 2)
    expect(tangents.length).toBe(sampleRate * 2)

    // First point should be start, last point should be end of curve
    expect(points.slice(0, 2)).toEqual([0, 0])
    expect(points.slice(-2)).toEqual([30, 0])
})
