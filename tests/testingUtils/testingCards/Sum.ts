import { Card } from "../../../src/cardBase/card"
import { ValuePort } from "../../../src/cardBase/ports/port"
import { type DataType, dt } from "../../../src/cardBase/dataTypes"

/**
 * A simple test card that sums two input values.
 * TODO: Determine if we want this in our normal card library.
 */
export class Sum extends Card {
    title = "Sum"
    description = "Sums two values"
    inputs = [
        new ValuePort("a", false, dt.value(0)),
        new ValuePort("b", false, dt.value(0)),
    ]
    outputs = [new ValuePort("sum")]
    evaluateCount = 0

    init(): void {
        // Not needed
    }
    cleanup(): void {
        // Not needed
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        this.evaluateCount++
        const a = inputs[0]?.kind === "value" ? inputs[0].value : 0
        const b = inputs[1]?.kind === "value" ? inputs[1].value : 0
        return [dt.value(a + b)]
    }
}
