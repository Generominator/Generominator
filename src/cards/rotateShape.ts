import { Card } from "../cardBase/card.ts"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes.ts"
import { ShapePort, ValuePort, type Port } from "../cardBase/ports/port.ts"

function transformCurve(curve: Curve, fn: (p: number[]) => number[]): Curve {
    return {
        getValue: (t) => fn(curve.getValue(t)),
        ...(curve.getOutline
            ? { getOutline: () => curve.getOutline!().map(fn) }
            : {}),
        color: curve.color,
        closed: curve.closed,
    }
}

export class RotateShapeCard extends Card {
    title = "Rotate Shape"
    description =
        "Rotates a shape around the origin by the given angle in degrees."

    inputs: Port[] = [
        new ShapePort("shape", false),
        new ValuePort("angle (deg)", false, dt.value(0)),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const valueInput = inputs.find(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )
        const angleDeg = valueInput?.value ?? 0
        const theta = (angleDeg * Math.PI) / 180
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)

        if (!shapeInput || shapeInput.value.length === 0) {
            return [dt.shape([])]
        }

        const rotated = shapeInput.value.map((curve) =>
            transformCurve(curve, ([x, y]) => [
                x * cos - y * sin,
                x * sin + y * cos,
            ]),
        )
        return [dt.shape(rotated)]
    }

    init(): void {}
    cleanup(): void {}
}

export default RotateShapeCard
