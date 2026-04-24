import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { VectorPort, ValuePort, type Port } from "../cardBase/ports/port"

export class ZeroPad extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Zero Pad"
    description: string =
        "Pad a vector with 0s from the left or right (or both)"
    constructor() {
        super()
        this.inputs = [
            new VectorPort("vector", false, dt.vector([0, 0, 0])),
            new ValuePort("length", false, dt.value(0)),
            new ValuePort("side", false, dt.value(0)),
        ]
        this.outputs = [new VectorPort("vector")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 3 ||
            inputs[0].kind !== "vector" ||
            inputs[1].kind !== "value" ||
            inputs[2].kind !== "value"
        ) {
            throw new Error(
                `ZeroPad expects one vector input and two values (length, side), got: ${JSON.stringify(inputs)}`,
            )
        }
        const vector = inputs[0].value.components
        const length = inputs[1].value
        const side = inputs[2].value

        if (vector.length >= length) return [dt.vector(vector)]

        const result = []

        const pad = length - vector.length
        let lpad = 0
        let rpad = 0

        if (side < 0) lpad = pad
        else if (side > 0) rpad = pad
        else {
            lpad = Math.floor(pad / 2)
            rpad = Math.ceil(pad / 2)
        }

        // apparently new Array(lpad).fill(0) is slower than this?!

        for (let i = 0; i < lpad; ++i) {
            result.push(0)
        }

        // result.push(...vector[i]) does not like very large arrays
        // I want to use this for audio data
        for (let i = 0; i < vector.length; ++i) {
            result.push(vector[i])
        }

        for (let i = 0; i < rpad; ++i) {
            result.push(0)
        }

        return [dt.vector(result)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
