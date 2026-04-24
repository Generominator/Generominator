import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ValuePort, VectorPort, type Port } from "../cardBase/ports/port"

export class Values2Vector extends Card implements EventEmitting {
    inputs: Port[]
    outputs: Port[]
    title: string = "Values 2 Vector"
    description: string = ""

    private eventCallback: CardEventCallback | null = null
    number: number

    constructor() {
        super()
        this.number = 2
        this.inputs = []
        for (let i = 0; i < this.number; i++) {
            this.inputs.push(new ValuePort(`#${i + 1}`, false))
        }
        this.outputs = [new VectorPort("vector")]
    }
    // Allows the ui to set the value and trigger an update
    setValue(dimension: number) {
        if (this.number !== dimension && dimension > 0 && dimension <= 6) {
            this.number = dimension
            this.inputs = []
            for (let i = 0; i < this.number; i++) {
                this.inputs.push(new ValuePort(`#${i + 1}`))
            }
            if (this.eventCallback) this.eventCallback()
        }
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vector: DataTypeOf<"vector"> = dt.vector(Array(this.number))
        for (let i = 0; i < vector.value.dimension; i++) {
            vector.value.set(i, (inputs[i] as DataTypeOf<"value">).value)
        }
        return [vector]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }
}
