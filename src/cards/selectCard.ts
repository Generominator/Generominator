import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, type Port, ValuePort } from "../cardBase/ports/port"

export class SelectCard extends Card {
    title: string = "Select"
    description: string =
        "Selects one of three inputs by index. Indices clamp to [0, 2]."

    in0Port: GenericPort = new GenericPort("0", true, "node")
    in1Port: GenericPort = new GenericPort("1", true, "node")
    in2Port: GenericPort = new GenericPort("2", true, "node")
    indexPort: ValuePort = new ValuePort("index", false)
    outPort: GenericPort = new GenericPort("out", false, "node")

    inputs: Port[] = [this.in0Port, this.in1Port, this.in2Port, this.indexPort]
    outputs: Port[] = [this.outPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const selector = inputs[3]
        if (selector?.kind !== "value") {
            throw new Error(
                "SelectCard missing/invalid input 'index' (expects value)",
            )
        }

        const clampedIndex = Math.max(
            0,
            Math.min(2, Math.trunc(selector.value)),
        )
        const selected = (inputs[clampedIndex] ?? null) as DataType | null

        if (!selected) {
            throw new Error(
                `SelectCard selected input '${clampedIndex}' is missing`,
            )
        }

        if (this.outPort.boundType === null) {
            if (selected.kind === "generic") {
                throw new Error(
                    `SelectCard cannot bind from '${selected.kind}'`,
                )
            }
        } else if (selected.kind !== this.outPort.boundType) {
            throw new Error(
                `SelectCard received type '${selected.kind}' but is bound to '${this.outPort.boundType}'`,
            )
        }

        return [selected]
    }
}
