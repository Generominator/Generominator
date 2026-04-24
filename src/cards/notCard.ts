import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { StatePort, type Port } from "../cardBase/ports/port"

export class NotCard extends Card {
    title: string = "Not"
    description: string = "Inverts a state input."

    inPort: StatePort = new StatePort("in", false)
    outPort: StatePort = new StatePort("out")

    inputs: Port[] = [this.inPort]
    outputs: Port[] = [this.outPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const input = inputs[0]
        if (!input || input.kind !== "state") {
            throw new Error("NotCard expects one state input: 'in'")
        }
        return [dt.state(!input.value)]
    }
}
