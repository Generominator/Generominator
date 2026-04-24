import { test, expect } from "vitest"
import { PCA } from "../../src/cards/pca"
import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"
import { VectorFieldPort, ValuePort } from "../../src/cardBase/ports/port"

test("PCA card ports are correct", () => {
    const card = new PCA()
    expect(card.inputs.length).toBe(2)
    expect(card.inputs[0]).toBeInstanceOf(VectorFieldPort)
    expect(card.inputs[0].label).toBe("vectors")
    expect(card.inputs[1]).toBeInstanceOf(ValuePort)
    expect(card.inputs[1].label).toBe("num components")
    expect(card.outputs.length).toBe(1)
    expect(card.outputs[0]).toBeInstanceOf(VectorFieldPort)
    expect(card.outputs[0].label).toBe("transformed vectors")
})

test("PCA transforms vectors and reduces dimensionality", async () => {
    // simple 2D vectors
    const vectors = [
        dt.vector([1, 1]),
        dt.vector([-1, -1]),
        dt.vector([2, 2]),
        dt.vector([-2, -2]),
    ]
    const card = new PCA()
    const result = await card.evaluate([dt.vectorfield(vectors), dt.value(1)])
    expect(Array.isArray(result)).toBe(true)
    const out = result[0] as DataTypeOf<"vectorfield">
    expect(out.kind).toBe("vectorfield")
    expect(out.vectors.length).toBe(vectors.length)
    expect(out.vectors[0].value.dimension).toBe(1)
    // Check that transformed values are symmetric/opposite for symmetric input
    expect(Math.abs(out.vectors[0].value.x())).toBeCloseTo(
        Math.abs(out.vectors[1].value.x()),
        6,
    )
    expect(Math.abs(out.vectors[2].value.x())).toBeCloseTo(
        Math.abs(out.vectors[3].value.x()),
        6,
    )
})

test("PCA handles more components than vector length", async () => {
    const vectors = [dt.vector([1, 2, 3]), dt.vector([4, 5, 6])]
    const card = new PCA()
    const result = await card.evaluate([
        dt.vectorfield(vectors),
        dt.value(5), // request more components than possible
    ])
    const out = result[0] as DataTypeOf<"vectorfield">
    expect(out.vectors[0].value.dimension).toBeLessThanOrEqual(3)
})
