import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { StatePort, type Port } from "../cardBase/ports/port"

export class AndCard extends Card {
    title: string = "And"
    description: string = "Outputs true when both inputs are true."

    aPort: StatePort = new StatePort("a", false)
    bPort: StatePort = new StatePort("b", false)
    outPort: StatePort = new StatePort("out")

    inputs: Port[] = [this.aPort, this.bPort]
    outputs: Port[] = [this.outPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const a = inputs[0]
        const b = inputs[1]

        if (!a || a.kind !== "state" || !b || b.kind !== "state") {
            throw new Error("AndCard expects two state inputs: 'a' and 'b'")
        }

        return [dt.state(a.value && b.value)]
    }
}
