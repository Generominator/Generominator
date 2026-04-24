import { Card } from "../cardBase/card"
import type { DataTypeOf } from "../cardBase/dataTypes"
import { Vector, dt } from "../cardBase/dataTypes"

type Shape = { verts: DataTypeOf<"vector">[] }
import { ShapePort, ValuePort, VectorFieldPort } from "../cardBase/ports/port"
import type { DataType } from "../cardBase/dataTypes"

/**
 * Checks if a point is inside a polygon using ray casting algorithm
 */
function isPointInsidePolygon(
    point: Vector,
    verts: DataTypeOf<"vector">[],
): boolean {
    const x = point.x()
    const y = point.y()
    let inside = false

    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i].value.x()
        const yi = verts[i].value.y()
        const xj = verts[j].value.x()
        const yj = verts[j].value.y()

        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }

    return inside
}

/**
 * Distributes points inside a shape based on density
 * @param shape - A shape object with vertices
 * @param density - Points per unit area (default: 10)
 * @returns Array of vectors representing distributed points
 */
function distributePointsInsideShape(
    shape: Shape,
    density: number = 10,
): Vector[] {
    const verts = shape.verts

    if (verts.length < 3) {
        throw new Error("A shape must have at least 3 vertices")
    }

    // Find bounding box
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const vert of verts) {
        const x = vert.value.x()
        const y = vert.value.y()
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
    }

    // Calculate step size based on density
    const width = maxX - minX
    const height = maxY - minY
    const area = width * height
    const totalPoints = Math.max(1, Math.floor(area * density))
    const step = Math.sqrt(area / totalPoints)

    const points: Vector[] = []

    // Grid-based point distribution
    for (let y = minY; y <= maxY; y += step) {
        for (let x = minX; x <= maxX; x += step) {
            const testPoint = new Vector([x, y])
            if (isPointInsidePolygon(testPoint, verts)) {
                points.push(testPoint)
            }
        }
    }

    return points
}

/**
 * Card that distributes points across a shape
 */
export class DistributePointsCard extends Card {
    title = "distribute points"
    description = "distribute a number of points inside a shape"

    inputs = [
        new ShapePort("shape", false),
        new ValuePort("density of points", false, dt.value(10)),
    ]
    outputs = [new VectorFieldPort("resulting points")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs[0] as DataTypeOf<"shape">
        const densityInput = inputs[1] as DataTypeOf<"value">

        const shapeValue = shapeInput.value
        const density = densityInput?.value ?? 10

        const step = 0.01
        const verts: DataTypeOf<"vector">[] = []
        for (const curve of shapeValue) {
            const outline = curve.getOutline?.()
            if (outline) {
                for (const pt of outline) verts.push(dt.vector(pt))
            } else {
                for (let t = 0; t <= 1; t += step) {
                    verts.push(dt.vector(curve.getValue(t)))
                }
            }
        }
        const points = distributePointsInsideShape({ verts }, density)

        // Convert Vector objects to DataType vectors
        const vectorPoints: DataTypeOf<"vector">[] = points.map((p) =>
            dt.vector(p.components),
        )

        return [dt.vectorfield(vectorPoints)]
    }

    init(): void {}

    cleanup(): void {}
}
