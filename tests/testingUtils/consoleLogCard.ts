import { Card } from "../../src/cardBase/card"
import type { Port } from "../../src/cardBase/ports/port"
import { TextPort } from "../../src/cardBase/ports/port"
import type { DataType, DataTypeOf } from "../../src/cardBase/dataTypes"

export class ConsoleLogCard extends Card {
    title = "Console Log Card"
    description = "Logs text input to the console"
    inputs: Port[] = [new TextPort("text")]
    outputs: Port[] = []

    init(): void {
        // Nothing to initialize
    }

    cleanup(): void {
        // Nothing to clean up
    }

    evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (inputs.length > 0 && inputs[0]) {
            const textInput = inputs[0] as DataTypeOf<"text">
            console.log(textInput.value)
        }
        return Promise.resolve([])
    }
}
