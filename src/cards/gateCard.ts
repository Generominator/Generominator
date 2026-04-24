import { Card, type OutputRoutableCard } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { GenericPort, StatePort, type Port } from "../cardBase/ports/port"

export class GateCard extends Card implements OutputRoutableCard {
    title: string = "Gate"
    description: string =
        "Forwards x only when enabled is true. Downstream execution is skipped when disabled."

    inputPort: GenericPort = new GenericPort("x", false, "node")
    enabledPort: StatePort = new StatePort("enabled", false)
    outputPort: GenericPort = new GenericPort("out", true, "node")

    inputs: Port[] = [this.inputPort, this.enabledPort]
    outputs: Port[] = [this.outputPort]

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    getActiveOutputIndices(inputs: DataType[]): readonly number[] {
        const enabled = inputs[1]
        if (!enabled || enabled.kind !== "state") {
            return []
        }
        return enabled.value ? [0] : []
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const x = inputs[0]
        const enabled = inputs[1]

        if (!x) {
            throw new Error("GateCard missing input 'x'")
        }
        if (!enabled || enabled.kind !== "state") {
            throw new Error(
                "GateCard missing/invalid input 'enabled' (expects state)",
            )
        }

        if (this.inputPort.boundType === null) {
            if (x.kind === "generic") {
                throw new Error(`GateCard cannot bind from '${x.kind}'`)
            }
        } else if (x.kind !== this.inputPort.boundType) {
            throw new Error(
                `GateCard received type '${x.kind}' but is bound to '${this.inputPort.boundType}'`,
            )
        }

        return [x]
    }
}
