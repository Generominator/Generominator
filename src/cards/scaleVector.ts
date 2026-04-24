import { Card } from "../cardBase/card"
import type { EventEmitting, CardEventCallback } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { VectorPort, ValuePort, type Port } from "../cardBase/ports/port"

export class ScaleVector extends Card implements EventEmitting {
    title = "Scale Vector"
    description = "Scale each component of a vector from one range to another"
    method: string = "log"
    methods: string[] = ["log", "sqrt", "linear"]
    private eventCallback: CardEventCallback | null = null

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    setMethod(method: string): void {
        if (this.method !== method) {
            this.method = method
            this.eventCallback?.()
        }
    }
    inputs: Port[] = [
        new VectorPort("vector", false, dt.vector([0, 0, 0])),
        new ValuePort("source min", false, dt.value(0)),
        new ValuePort("source max", false, dt.value(1)),
        new ValuePort("target min", false, dt.value(0)),
        new ValuePort("target max", false, dt.value(1)),
    ]
    outputs: Port[] = [new VectorPort("vector")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vector = inputs.find(
            (input): input is DataTypeOf<"vector"> => input.kind === "vector",
        )
        const values = inputs.filter(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )

        if (!vector || values.length < 4) {
            throw new Error(
                `ScaleVector requires one vector and four value inputs (source/target min/max), got: ${JSON.stringify(inputs)}`,
            )
        }

        const source_min = values[0].value
        const source_max = values[1].value
        const target_min = values[2].value
        const target_max = values[3].value
        const source_length = source_max - source_min
        const target_length = target_max - target_min

        const scaledComponents = vector.value.components.map((component) => {
            let t = (component - source_min) / source_length
            if (this.method === "log" && t > 0) t = Math.log10(9 * t + 1)
            else if (this.method === "sqrt" && t >= 0) t = Math.sqrt(t)
            return target_min + t * target_length
        })

        return [dt.vector(scaledComponents)]
    }

    init(): void {}
    cleanup(): void {}
}

export default ScaleVector
