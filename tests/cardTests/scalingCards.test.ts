import { test, expect } from "vitest"
import { Scaling } from "../../src/cards/scaling"
import { ScaleVector } from "../../src/cards/scaleVector"
import { ScaleVectorfield } from "../../src/cards/scaleVectorfield"
import { dt } from "../../src/cardBase/dataTypes"

const inputs = [3, 5, 10, 25, 55, 100]
const expected = [0.03, 0.05, 0.1, 0.25, 0.55, 1.0]

test("Scaling scales 3 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(3),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(0.03, 10)
})

test("Scaling scales 5 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(5),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(0.05, 10)
})

test("Scaling scales 10 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(10),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(0.1, 10)
})

test("Scaling scales 25 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(25),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(0.25, 10)
})

test("Scaling scales 55 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(55),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(0.55, 10)
})

test("Scaling scales 100 linearly from 0-100 to 0-1", async () => {
    const card = new Scaling()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.value(100),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("value")
    if (result[0].kind !== "value") throw new Error("Expected value kind")
    expect(result[0].value).toBeCloseTo(1.0, 10)
})

test("ScaleVector scales all components linearly from 0-100 to 0-1", async () => {
    const card = new ScaleVector()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.vector([3, 5, 10, 25, 55, 100]),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("vector")
    if (result[0].kind !== "vector") throw new Error("Expected vector kind")
    const components = result[0].value.components
    for (let i = 0; i < inputs.length; ++i) {
        expect(components[i]).toBeCloseTo(expected[i], 10)
    }
})

test("ScaleVectorfield scales all vectors linearly from 0-100 to 0-1", async () => {
    const card = new ScaleVectorfield()
    card.setMethod("linear")
    const result = await card.evaluate([
        dt.vectorfield([dt.vector([3, 5, 10]), dt.vector([25, 55, 100])]),
        dt.value(0),
        dt.value(100),
        dt.value(0),
        dt.value(1),
    ])
    expect(result[0].kind).toBe("vectorfield")
    if (result[0].kind !== "vectorfield")
        throw new Error("Expected vectorfield kind")
    expect(result[0].vectors.length).toBe(2)

    const v1 = result[0].vectors[0]
    expect(v1.value.components[0]).toBeCloseTo(0.03, 10)
    expect(v1.value.components[1]).toBeCloseTo(0.05, 10)
    expect(v1.value.components[2]).toBeCloseTo(0.1, 10)

    const v2 = result[0].vectors[1]
    expect(v2.value.components[0]).toBeCloseTo(0.25, 10)
    expect(v2.value.components[1]).toBeCloseTo(0.55, 10)
    expect(v2.value.components[2]).toBeCloseTo(1.0, 10)
})
