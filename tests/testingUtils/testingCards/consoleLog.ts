import { Card } from "../../../src/cardBase/card"
import type { Port } from "../../../src/cardBase/ports/port"
import { GenericPort } from "../../../src/cardBase/ports/port"
import type { DataType } from "../../../src/cardBase/dataTypes"

export class ConsoleLogCard extends Card {
    title = "Console Log Card"
    description: string
    inputs: Port[] = [new GenericPort("any", true, "node")]
    outputs: Port[] = []
    tag: string = Math.random().toString(36).substring(2, 6).toUpperCase()

    constructor() {
        super()
        this.description = `Logs any input to the console for debugging [${this.tag}]`
    }

    init(): void {}
    cleanup(): void {}

    evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (inputs.length > 0 && inputs[0]) {
            const prefix = `[ConsoleLogCard ${this.tag}]`
            console.log(prefix, inputs[0])
        }
        return Promise.resolve([])
    }
}
