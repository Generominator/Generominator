import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { VectorPort, ValuePort, type Port } from "../cardBase/ports/port"

export class MakeVector extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Vector from values"
    description: string = "Turn 3 values into a 3D vector"
    constructor() {
        super()
        this.inputs = [
            new ValuePort("x", false, dt.value(0)),
            new ValuePort("y", false, dt.value(0)),
            new ValuePort("z", false, dt.value(0)),
        ]
        this.outputs = [new VectorPort("vector")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 3 ||
            inputs[0].kind !== "value" ||
            inputs[1].kind !== "value" ||
            inputs[2].kind !== "value"
        ) {
            throw new Error(
                `MakeVector expects three value inputs (x,y,z), got: ${JSON.stringify(inputs)}`,
            )
        }

        return [dt.vector([inputs[0].value, inputs[1].value, inputs[2].value])]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
