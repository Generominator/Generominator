import { Card } from "../cardBase/card.ts"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes.ts"
import {
    ShapePort,
    ColorPort,
    ValuePort,
    type Port,
} from "../cardBase/ports/port.ts"

function recolorCurve(
    curve: Curve,
    color: [number, number, number, number],
): Curve {
    return {
        getValue: (t) => curve.getValue(t),
        ...(curve.getOutline ? { getOutline: () => curve.getOutline!() } : {}),
        color: color,
        closed: curve.closed,
    }
}

export class SetShapeColor extends Card {
    title = "Set Shape Color"
    description = "Sets the color of one or all curves in a shape"

    inputs: Port[] = [
        new ShapePort("shape"),
        new ColorPort("color", false, dt.color(255, 0, 0)),
        new ValuePort("index", true, dt.value(1)),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const colorInput = inputs.find(
            (i): i is DataTypeOf<"color"> => i.kind === "color",
        )
        const valueInputs = inputs.filter(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )

        const index = valueInputs[0]?.value ?? null

        if (!shapeInput || shapeInput.value.length === 0 || !colorInput) {
            return [dt.shape([])]
        }

        const color: [number, number, number, number] = [
            colorInput.r,
            colorInput.g,
            colorInput.b,
            colorInput.a,
        ]
        let output = [...shapeInput.value]
        if (index) {
            output[index] = recolorCurve(shapeInput.value[index], color)
        } else {
            output = output.map((c) => recolorCurve(c, color))
        }
        return [dt.shape(output)]
    }

    init(): void {}
    cleanup(): void {}
}

export default SetShapeColor
