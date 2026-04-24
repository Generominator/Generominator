import { Card } from "../../../src/cardBase/card"
import { ValuePort } from "../../../src/cardBase/ports/port"
import { type DataType, dt } from "../../../src/cardBase/dataTypes"

/**
 * A simple test card that increments the input value by 100 each time it is evaluated.
 * Also tracks the number of times it has been evaluated.
 */
export class Increment extends Card {
    title = "Passthrough"
    description = "Passes value through, incrementing it"
    inputs = [new ValuePort("input")]
    outputs = [new ValuePort("output")]

    evaluateCount = 0

    init(): void {
        //Not needed
    }
    cleanup(): void {
        //Not needed
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        this.evaluateCount++
        const input = inputs[0]
        if (input?.kind === "value") {
            return [dt.value(input.value + 100)]
        }
        return [dt.value(0)]
    }
}
