import { Card } from "../../../src/cardBase/card.ts"
import { Port, ValuePort } from "../../../src/cardBase/ports/port.ts"
import { type DataType, dt } from "../../../src/cardBase/dataTypes.ts"

export class ConstValueCard extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string
    description: string

    number: number

    constructor() {
        super()
        this.title = "Const Value"
        this.description = "A card that outputs a constant value."
        this.number = 5
        this.inputs = []
        this.outputs = [new ValuePort()]
    }

    cleanup(): void {
        // No cleanup necessary for this card
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.value(this.number)]
    }

    init(): void {
        // No initialization necessary for this card
    }
}
