import { Card } from "../cardBase/card"
import type { EventEmitting, CardEventCallback } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { ValuePort, type Port } from "../cardBase/ports/port"

export class Scaling extends Card implements EventEmitting {
    inputs: Port[]
    outputs: Port[]
    title: string = "Scaling"
    description: string = "Scale a value from one range to another"
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
    constructor() {
        super()
        this.inputs = [
            new ValuePort("value", false),
            new ValuePort("source min", false, dt.value(0)),
            new ValuePort("source max", false, dt.value(1)),
            new ValuePort("target min", false, dt.value(0)),
            new ValuePort("target max", false, dt.value(1)),
        ]
        this.outputs = [new ValuePort("value")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length < 5 ||
            inputs[0].kind !== "value" ||
            inputs[1].kind !== "value" ||
            inputs[2].kind !== "value" ||
            inputs[3].kind !== "value" ||
            inputs[4].kind !== "value"
        ) {
            throw new Error(
                `Scaling expects exactly five values as inputs got: ${JSON.stringify(inputs)}`,
            )
        }

        const value = inputs[0].value
        const source_min = inputs[1].value
        const source_max = inputs[2].value
        const target_min = inputs[3].value
        const target_max = inputs[4].value
        const source_length = source_max - source_min
        const target_length = target_max - target_min
        let t = (value - source_min) / source_length
        if (this.method === "log") {
            if (t > 0) t = Math.log10(9 * t + 1)
        } else if (this.method === "sqrt") {
            if (t >= 0) t = Math.sqrt(t)
        }

        return [dt.value(target_min + t * target_length)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
