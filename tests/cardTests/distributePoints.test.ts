import { expect, test } from "vitest"
import type { DataTypeOf, DataType, Curve } from "../../src/cardBase/dataTypes"
import { dt, PolygonCurve } from "../../src/cardBase/dataTypes"
import { DistributePointsCard } from "../../src/cards/distributePoints"
import { SuperformulaCard } from "../../src/cards/superFormula"

// Type guard for vectorfield DataType
function isVectorField(dt: DataType): dt is DataTypeOf<"vectorfield"> {
    return dt.kind === "vectorfield"
}

// Type guard for vector DataType
function isVector(dt: DataType): dt is DataTypeOf<"vector"> {
    return dt.kind === "vector"
}

// Type guard for shape DataType
function isShape(dt: DataType): dt is DataTypeOf<"shape"> {
    return dt.kind === "shape"
}

// Helper to create a shape
function createShape(verts: number[][]): DataTypeOf<"shape"> {
    return dt.shape([new PolygonCurve(verts as [number, number][])])
}

// Helper to check if a point is inside a polygon (for test validation)
function isPointInside(x: number, y: number, verts: number[][]): boolean {
    let inside = false
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i][0]
        const yi = verts[i][1]
        const xj = verts[j][0]
        const yj = verts[j][1]

        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }
    return inside
}

test("returns a vectorfield", async () => {
    const card = new DistributePointsCard()
    const shape = createShape([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ])
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    expect(isVectorField(output)).toBe(true)
    if (!isVectorField(output)) throw new Error("Expected vectorfield output")
    expect(output.vectors.length).toBeGreaterThan(0)
})

test("generates points inside a square", async () => {
    const card = new DistributePointsCard()
    const vertices = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ]
    const shape = createShape(vertices)
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    expect(output.vectors.length).toBeGreaterThan(0)

    // Check all points are inside the square
    for (const vec of output.vectors) {
        expect(isVector(vec)).toBe(true)
        if (!isVector(vec)) continue

        const x = vec.value.x()
        const y = vec.value.y()

        expect(isPointInside(x, y, vertices)).toBe(true)
    }
})

test("higher density produces more points", async () => {
    const card = new DistributePointsCard()
    const shape = createShape([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
    ])

    const lowDensity = dt.value(5)
    const highDensity = dt.value(20)

    const [lowOutput] = await card.evaluate([shape, lowDensity])
    const [highOutput] = await card.evaluate([shape, highDensity])

    if (!isVectorField(lowOutput) || !isVectorField(highOutput)) {
        throw new Error("Expected vectorfield outputs")
    }

    expect(highOutput.vectors.length).toBeGreaterThan(lowOutput.vectors.length)
})

test("works with triangle shape", async () => {
    const card = new DistributePointsCard()
    const vertices = [
        [0, 0],
        [2, 0],
        [1, 2],
    ]
    const shape = createShape(vertices)
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    expect(output.vectors.length).toBeGreaterThan(0)

    // Verify points are inside the triangle
    for (const vec of output.vectors) {
        if (!isVector(vec)) continue

        const x = vec.value.x()
        const y = vec.value.y()

        expect(isPointInside(x, y, vertices)).toBe(true)
    }
})

test("works with pentagon shape", async () => {
    const card = new DistributePointsCard()
    const vertices = [
        [0, 0],
        [2, 0],
        [3, 1.5],
        [1.5, 3],
        [-0.5, 1.5],
    ]
    const shape = createShape(vertices)
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    expect(output.vectors.length).toBeGreaterThan(0)

    // Sample check - verify some points are inside
    let insideCount = 0
    for (const vec of output.vectors) {
        if (!isVector(vec)) continue

        const x = vec.value.x()
        const y = vec.value.y()

        if (isPointInside(x, y, vertices)) insideCount++
    }

    expect(insideCount).toBe(output.vectors.length)
})

test("uses default density when not provided", async () => {
    const card = new DistributePointsCard()
    const shape = createShape([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ])

    // Pass only shape input, density will use default value of 10
    const [output] = await card.evaluate([shape])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    // Should still produce points with default density
    expect(output.vectors.length).toBeGreaterThan(0)
})

test("all generated points are 2D vectors", async () => {
    const card = new DistributePointsCard()
    const shape = createShape([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ])
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    for (const vec of output.vectors) {
        expect(isVector(vec)).toBe(true)
        expect(vec.value.dimension).toBe(2)
    }
})

test("L-shaped polygon generates points", async () => {
    const card = new DistributePointsCard()
    const vertices = [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
        [2, 3],
        [0, 3],
    ]
    const shape = createShape(vertices)
    const density = dt.value(10)

    const [output] = await card.evaluate([shape, density])

    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    expect(output.vectors.length).toBeGreaterThan(0)

    // All points should be inside the L-shape
    for (const vec of output.vectors) {
        if (!isVector(vec)) continue

        const x = vec.value.x()
        const y = vec.value.y()

        expect(isPointInside(x, y, vertices)).toBe(true)
    }
})

test("works with superformula curves", async () => {
    const superformula = new SuperformulaCard()
    const distribute = new DistributePointsCard()

    const [shapeOutput] = await superformula.evaluate([
        dt.value(5),
        dt.value(4),
        dt.value(4),
        dt.value(4),
        dt.value(1),
    ])

    if (!isShape(shapeOutput)) {
        throw new Error("Expected shape output from superformula")
    }

    const [output] = await distribute.evaluate([shapeOutput])

    expect(isVectorField(output)).toBe(true)
    if (!isVectorField(output)) throw new Error("Expected vectorfield output")

    expect(output.vectors.length).toBeGreaterThan(0)

    const curves = shapeOutput.value as Curve[]
    const step = 0.01
    const vertices: number[][] = []
    for (const curve of curves) {
        for (let t = 0; t <= 1; t += step) {
            vertices.push(curve.getValue(t))
        }
    }

    for (const vec of output.vectors) {
        expect(isVector(vec)).toBe(true)
        expect(vec.value.dimension).toBe(2)

        const x = vec.value.x()
        const y = vec.value.y()
        expect(isPointInside(x, y, vertices)).toBe(true)
    }
})
