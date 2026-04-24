import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { VectorFieldPort, type Port } from "../cardBase/ports/port"

export class RandomAssVectorField extends Card implements EventEmitting {
    inputs: Port[]
    outputs: Port[]
    title: string = "Random Vectorfield"
    description: string = ""

    private eventCallback: CardEventCallback | null = null
    number: number

    constructor() {
        super()
        this.inputs = []
        this.outputs = [new VectorFieldPort("vector field")]
        this.number = 10
    }
    // Allows the ui to set the value and trigger an update
    setValue(num_vectors: number) {
        if (this.number !== num_vectors) {
            this.number = num_vectors
            if (this.eventCallback) this.eventCallback()
        }
    }
    async evaluate(): Promise<DataType[]> {
        const vectors: DataTypeOf<"vector">[] = []
        for (let i = 0; i < this.number; i++) {
            vectors.push(
                dt.vector([
                    Math.random() * 200 - 100,
                    Math.random() * 200 - 100,
                ]),
            )
        }
        return [dt.vectorfield(vectors)]
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
