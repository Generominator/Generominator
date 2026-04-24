import { Card } from "../../../src/cardBase/card"
import type { DataType } from "../../../src/cardBase/dataTypes"
import { GenericPort, type Port } from "../../../src/cardBase/ports/port"

/**
 * Counts how many times it is evaluated for any input type.
 */
export class DebugCounter extends Card {
    title = "Debug Counter"
    description = "Counts evaluations for generic input"
    inputs: Port[] = [new GenericPort("input", true, "node")]
    outputs: Port[] = []
    evaluateCount = 0

    init(): void {
        // Not needed
    }

    cleanup(): void {
        // Not needed
    }

    evaluate(): Promise<DataType[]> {
        this.evaluateCount++
        return Promise.resolve([])
    }
}
