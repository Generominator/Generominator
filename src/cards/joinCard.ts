import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, type Port } from "../cardBase/ports/port"

export class JoinCard extends Card {
    title: string = "Join"
    description: string =
        "Merges two optional branch-style inputs into one output. Exactly one input should carry data."

    inAPort: GenericPort = new GenericPort("a", true, "node")
    inBPort: GenericPort = new GenericPort("b", true, "node")
    outPort: GenericPort = new GenericPort("out", true, "node")

    inputs: Port[] = [this.inAPort, this.inBPort]
    outputs: Port[] = [this.outPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const a = (inputs[0] ?? null) as DataType | null
        const b = (inputs[1] ?? null) as DataType | null

        const hasA = a !== null
        const hasB = b !== null

        if (hasA && hasB) {
            throw new Error(
                "JoinCard received both inputs; expected only one active input",
            )
        }
        if (!hasA && !hasB) {
            throw new Error("JoinCard missing both inputs")
        }

        const out = (a ?? b)!
        if (this.inAPort.boundType === null) {
            if (out.kind === "generic") {
                throw new Error(`JoinCard cannot bind from '${out.kind}'`)
            }
        } else if (out.kind !== this.inAPort.boundType) {
            throw new Error(
                `JoinCard received type '${out.kind}' but is bound to '${this.inAPort.boundType}'`,
            )
        }

        return [out]
    }
}
