import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { VectorPort, ValuePort, type Port } from "../cardBase/ports/port"

export class VectorIndex extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Vector Index"
    description: string = ""
    constructor() {
        super()
        this.inputs = [
            new VectorPort("vector", false, dt.vector([0, 0, 0])),
            new ValuePort("index", false, dt.value(0)),
        ]
        this.outputs = [new ValuePort("value")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 2 ||
            inputs[0].kind !== "vector" ||
            inputs[1].kind !== "value"
        ) {
            throw new Error(
                `VectorIndex expects exactly two inputs (vector, index), got: ${JSON.stringify(inputs)}`,
            )
        }
        return [dt.value(inputs[0].value.components[inputs[1].value])]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
