import { Card } from "../../src/cardBase/card"
import { ValuePort } from "../../src/cardBase/ports/port"
import { type DataType, dt } from "../../src/cardBase/dataTypes"

/**
 * A test card that simulates a slow evaluation by adding a small delay.
 */
export class SlowCard extends Card {
    title = "Slow"
    description = "Takes time to evaluate"
    inputs = [new ValuePort("input")]
    outputs = [new ValuePort("output")]

    evaluateCount = 0

    init(): void {}
    cleanup(): void {}

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        this.evaluateCount++
        // Small delay to allow event merge testing
        await new Promise((resolve) => setTimeout(resolve, 10))
        const input = inputs[0]?.kind === "value" ? inputs[0].value : 0
        return [dt.value(input + 100)]
    }
}
