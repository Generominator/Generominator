import { Card } from "../../src/cardBase/card"
import type { DataType } from "../../src/cardBase/dataTypes"
import { GenericPort } from "../../src/cardBase/ports/port"

/**
 * Test card that forwards one node-scoped generic input to one output.
 */
export class PassThroughDebugCard extends Card {
    title = "PassThroughDebug"
    description = "Forwards input"

    inPort = new GenericPort("in", false, "node")
    outPort = new GenericPort("out", true, "node")

    inputs = [this.inPort]
    outputs = [this.outPort]

    init(): void {
        // Not needed in tests
    }

    cleanup(): void {
        // Not needed in tests
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        return [inputs[0]]
    }
}
