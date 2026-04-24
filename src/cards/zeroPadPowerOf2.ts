import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { VectorPort, ValuePort, type Port } from "../cardBase/ports/port"

export class ZeroPadPowerOf2 extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Zero Pad To Power of 2"
    description: string =
        "Pad a vector with 0s from the left or right (or both) until the vector has length equal to the next highest power of 2 of its current length (e.g. a vector of length 67 will be padded to length 128)"
    constructor() {
        super()
        this.inputs = [
            new VectorPort("vector", false, dt.vector([0, 0, 0])),
            new ValuePort("side", false, dt.value(0)),
        ]
        this.outputs = [new VectorPort("vector")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 2 ||
            inputs[0].kind !== "vector" ||
            inputs[1].kind !== "value"
        ) {
            throw new Error(
                `ZeroPadPowerOf2 expects one vector input and a value, got: ${JSON.stringify(inputs)}`,
            )
        }
        const vector = inputs[0].value.components
        const side = inputs[1].value

        const length = 2 ** Math.ceil(Math.log2(vector.length))

        if (vector.length >= length) {
            return [dt.vector(vector)]
        }

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
