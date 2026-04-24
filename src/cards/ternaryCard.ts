import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, StatePort, type Port } from "../cardBase/ports/port"

export class TernaryCard extends Card {
    title: string = "Ternary"
    description: string = "Outputs a when cond is true, otherwise outputs b."

    condPort: StatePort = new StatePort("cond", false)
    aPort: GenericPort = new GenericPort("a", false, "node")
    bPort: GenericPort = new GenericPort("b", false, "node")
    outPort: GenericPort = new GenericPort("out", false, "node")

    inputs: Port[] = [this.condPort, this.aPort, this.bPort]
    outputs: Port[] = [this.outPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const cond = inputs[0]
        const a = inputs[1]
        const b = inputs[2]

        if (!cond || cond.kind !== "state") {
            throw new Error(
                "TernaryCard missing/invalid input 'cond' (expects state)",
            )
        }
        if (!a) {
            throw new Error("TernaryCard missing input 'a'")
        }
        if (!b) {
            throw new Error("TernaryCard missing input 'b'")
        }

        const selected = cond.value ? a : b

        if (this.outPort.boundType === null) {
            if (selected.kind === "generic") {
                throw new Error(
                    `TernaryCard cannot bind from '${selected.kind}'`,
                )
            }
        } else if (selected.kind !== this.outPort.boundType) {
            throw new Error(
                `TernaryCard received type '${selected.kind}' but is bound to '${this.outPort.boundType}'`,
            )
        }

        return [selected]
    }
}
