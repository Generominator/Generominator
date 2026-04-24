import { Card } from "../../src/cardBase/card"
import { Port, ValuePort } from "../../src/cardBase/ports/port"
import type { DataType } from "../../src/cardBase/dataTypes"

/**
 * A test card that always fails when evaluated.
 */
export class FailingCard extends Card {
    title = "Failing"
    description = "Always fails"
    inputs: Port[] = []
    outputs = [new ValuePort("value")]

    init(): void {
        // Not needed
    }
    cleanup(): void {
        // Not needed
    }

    async evaluate(): Promise<DataType[]> {
        throw new Error("Fail Card Evaluated")
    }
}
