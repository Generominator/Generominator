import { Card } from "../../src/cardBase/card"
import { GenericPort } from "../../src/cardBase/ports/port"

/**
 * Test sink card that counts evaluations and accepts any input.
 */
export class CountingSinkCard extends Card {
    title = "CountingSink"
    description = "Counts evaluations"

    inPort = new GenericPort("in", false)
    inputs = [this.inPort]
    outputs = []

    evaluateCount = 0

    init(): void {
        // Not needed in tests
    }

    cleanup(): void {
        // Not needed in tests
    }

    async evaluate(): Promise<DataType[]> {
        this.evaluateCount++
        return []
    }
}
