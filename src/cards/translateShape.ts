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

export class TranslateShapeCard extends Card {
    title = "Translate Shape"
    description = "Shifts a shape by dx and dy offsets."

    inputs: Port[] = [
        new ShapePort("shape", false),
        new ValuePort("dx", true, dt.value(0)),
        new ValuePort("dy", true, dt.value(0)),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const valueInputs = inputs.filter(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )
        const dx = valueInputs[0]?.value ?? 0
        const dy = valueInputs[1]?.value ?? 0

        if (!shapeInput || shapeInput.value.length === 0) {
            return [dt.shape([])]
        }

        const translated = shapeInput.value.map((curve) =>
            transformCurve(curve, ([x, y]) => [x + dx, y + dy]),
        )
        return [dt.shape(translated)]
    }

    init(): void {}
    cleanup(): void {}
}

export default TranslateShapeCard
