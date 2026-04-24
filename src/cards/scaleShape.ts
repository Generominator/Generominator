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

export class ScaleShapeCard extends Card {
    title = "Scale Shape"
    description = "Scales a shape by independent x and y factors."

    inputs: Port[] = [
        new ShapePort("shape", false),
        new ValuePort("sx", false, dt.value(1)),
        new ValuePort("sy", false, dt.value(1)),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const valueInputs = inputs.filter(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )
        const sx = valueInputs[0]?.value ?? 1
        const sy = valueInputs[1]?.value ?? 1

        if (!shapeInput || shapeInput.value.length === 0) {
            return [dt.shape([])]
        }

        const scaled = shapeInput.value.map((curve) =>
            transformCurve(curve, ([x, y]) => [x * sx, y * sy]),
        )
        return [dt.shape(scaled)]
    }

    init(): void {}
    cleanup(): void {}
}

export default ScaleShapeCard
