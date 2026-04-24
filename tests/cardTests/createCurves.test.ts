import { test, expect } from "vitest"
import { CreateCurves } from "../../src/cards/createCurves"
import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"
import {
    VectorFieldPort,
    ValuePort,
    CurvePort,
} from "../../src/cardBase/ports/port"

test("returns a curve and endpoints match control points", async () => {
    const controlPoints = [
        dt.vector([100, 500]),
        dt.vector([200, 100]),
        dt.vector([400, 100]),
        dt.vector([500, 300]),
        dt.vector([600, 300]),
        dt.vector([700, 500]),
        dt.vector([750, 400]),
    ]

    const card = new CreateCurves()
    const results = await card.evaluate([dt.vectorfield(controlPoints)])

    const curveData = results.find(
        (r): r is DataTypeOf<"curve"> => r.kind === "curve",
    )

    expect(curveData).toBeDefined()
    const curve = curveData!.value

    // t=0 should be the first control point, t=1 the last
    expect(curve.getValue(0)).toEqual(controlPoints[0].value.components)
    expect(curve.getValue(1)).toEqual(
        controlPoints[controlPoints.length - 1].value.components,
    )
})

test("supports custom order input and returns numeric samples", async () => {
    const controlPoints = [
        dt.vector([0, 0]),
        dt.vector([10, 0]),
        dt.vector([20, 0]),
        dt.vector([30, 0]),
    ]

    const card = new CreateCurves()
    const results = await card.evaluate([
        dt.vectorfield(controlPoints),
        dt.value(4), // explicit order
    ])

    const curveData = results.find(
        (r): r is DataTypeOf<"curve"> => r.kind === "curve",
    )

    expect(curveData).toBeDefined()
    const curve = curveData!.value

    expect(curve.getValue(0)).toEqual([0, 0])
    expect(curve.getValue(1)).toEqual([30, 0])

    const mid = curve.getValue(0.5)
    expect(Array.isArray(mid)).toBe(true)
    expect(mid.length).toBe(2)
    expect(Number.isFinite(mid[0])).toBe(true)
    expect(Number.isFinite(mid[1])).toBe(true)
})

test("CreateCurves card ports are correct", () => {
    const card = new CreateCurves()
    expect(card.inputs.length).toBe(2)
    expect(card.inputs[0]).toBeInstanceOf(VectorFieldPort)
    expect(card.inputs[0].label).toBe("control points")
    expect(card.inputs[1]).toBeInstanceOf(ValuePort)
    expect(card.inputs[1].label).toBe("order")
    expect(card.outputs.length).toBe(1)
    expect(card.outputs[0]).toBeInstanceOf(CurvePort)
    expect(card.outputs[0].label).toBe("curve")
})
