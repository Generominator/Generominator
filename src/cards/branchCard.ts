import { Card, type OutputRoutableCard } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, type Port, StatePort } from "../cardBase/ports/port"

export class BranchCard extends Card implements OutputRoutableCard {
    title: string = "Branch"
    description: string =
        "Conditionally routes a value to one of two outputs; only the selected branch executes downstream."

    inputPort: GenericPort = new GenericPort("x", false, "node")
    condPort: StatePort = new StatePort("cond", false)

    truePort: GenericPort = new GenericPort("true", true, "node")
    falsePort: GenericPort = new GenericPort("false", true, "node")

    inputs: Port[] = [this.inputPort, this.condPort]
    outputs: Port[] = [this.truePort, this.falsePort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    getActiveOutputIndices(inputs: DataType[]): readonly number[] {
        const cond = inputs[1]
        if (!cond || cond.kind !== "state") {
            return []
        }
        return [cond.value ? 0 : 1]
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const x = inputs[0]
        const cond = inputs[1]

        if (!x) {
            throw new Error("BranchCard missing input 'x'")
        }
        if (!cond || cond.kind !== "state") {
            throw new Error(
                "BranchCard missing/invalid input 'cond' (expects state)",
            )
        }

        if (this.inputPort.boundType === null) {
            if (x.kind === "generic") {
                throw new Error(`BranchCard cannot bind from '${x.kind}'`)
            }
        } else if (x.kind !== this.inputPort.boundType) {
            throw new Error(
                `BranchCard received type '${x.kind}' but is bound to '${this.inputPort.boundType}'`,
            )
        }

        // Always emit x on both outputs. execution routing chooses which path runs.
        return [x, x]
    }
}
