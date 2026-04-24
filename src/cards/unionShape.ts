import { Card } from "../cardBase/card.ts"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes.ts"
import { ShapePort, type Port } from "../cardBase/ports/port.ts"

export class UnionShapeCard extends Card {
    title = "Union Shape"
    description = "Combines two shapes into one by concatenating their curves."

    inputs: Port[] = [
        new ShapePort("shape A", false),
        new ShapePort("shape B", false),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInputs = inputs.filter(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const shapeA = shapeInputs[0]?.value ?? []
        const shapeB = shapeInputs[1]?.value ?? []
        return [dt.shape([...shapeA, ...shapeB])]
    }

    init(): void {}
    cleanup(): void {}
}

export default UnionShapeCard
