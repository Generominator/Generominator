import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { StatePort, type Port, ValuePort } from "../cardBase/ports/port"

export class CompareCard extends Card {
    title: string = "Compare"
    description: string =
        "Compares two numbers and outputs three states for less-than, equal, and greater-than."

    aPort: ValuePort = new ValuePort("a", false)
    bPort: ValuePort = new ValuePort("b", false)

    ltPort: StatePort = new StatePort("<")
    eqPort: StatePort = new StatePort("=")
    gtPort: StatePort = new StatePort(">")

    inputs: Port[] = [this.aPort, this.bPort]
    outputs: Port[] = [this.ltPort, this.eqPort, this.gtPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const a = inputs[0]
        const b = inputs[1]

        if (!a || a.kind !== "value" || !b || b.kind !== "value") {
            throw new Error("CompareCard expects two value inputs: 'a' and 'b'")
        }

        return [
            dt.state(a.value < b.value),
            dt.state(a.value === b.value),
            dt.state(a.value > b.value),
        ]
    }
}
