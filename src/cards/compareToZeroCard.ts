import { Card, type OutputRoutableCard } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, type Port, ValuePort } from "../cardBase/ports/port"

export class CompareToZeroCard extends Card implements OutputRoutableCard {
    title: string = "Compare To Zero"
    description: string =
        "Routes a value to one of three outputs based on whether n is less than, equal to, or greater than zero."

    valuePort: GenericPort = new GenericPort("x", false, "node")
    numberPort: ValuePort = new ValuePort("n", false)

    lessThanZeroPort: GenericPort = new GenericPort("<0", true, "node")
    equalZeroPort: GenericPort = new GenericPort("=0", true, "node")
    greaterThanZeroPort: GenericPort = new GenericPort(">0", true, "node")

    inputs: Port[] = [this.valuePort, this.numberPort]
    outputs: Port[] = [
        this.lessThanZeroPort,
        this.equalZeroPort,
        this.greaterThanZeroPort,
    ]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    getActiveOutputIndices(inputs: DataType[]): readonly number[] {
        const n = inputs[1]
        if (!n || n.kind !== "value") {
            return []
        }
        if (n.value < 0) return [0]
        if (n.value > 0) return [2]
        return [1]
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const x = inputs[0]
        const n = inputs[1]

        if (!x) {
            throw new Error("CompareToZeroCard missing input 'x'")
        }
        if (!n || n.kind !== "value") {
            throw new Error(
                "CompareToZeroCard missing/invalid input 'n' (expects value)",
            )
        }

        if (this.valuePort.boundType === null) {
            if (x.kind === "generic") {
                throw new Error(
                    `CompareToZeroCard cannot bind from '${x.kind}'`,
                )
            }
        } else if (x.kind !== this.valuePort.boundType) {
            throw new Error(
                `CompareToZeroCard received type '${x.kind}' but is bound to '${this.valuePort.boundType}'`,
            )
        }

        // Emit x on all outputs
        return [x, x, x]
    }
}
