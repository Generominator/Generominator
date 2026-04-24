import { Card } from "../../../src/cardBase/card.ts"
import { type DataType, dt } from "../../../src/cardBase/dataTypes.ts"
import { Port, StatePort } from "../../../src/cardBase/ports/port.ts"

export class ConstStateCard extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string
    description: string

    state: boolean

    constructor() {
        super()
        this.title = "Const State"
        this.description = "A card that outputs a constant state."
        this.state = true
        this.inputs = []
        this.outputs = [new StatePort()]
    }

    cleanup(): void {
        // No cleanup necessary for this card
    }

    async evaluate(): Promise<DataType[]> {
        return [dt.state(this.state)]
    }

    init(): void {
        // No initialization necessary for this card
    }
}
