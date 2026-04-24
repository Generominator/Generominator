import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { StatePort, type Port } from "../cardBase/ports/port"

export class StateMemoryCard extends Card {
    title: string = "State Memory"
    description: string =
        "Stores a boolean state. Supports set/reset and rising-edge toggle."

    setPort: StatePort = new StatePort("set", false, dt.state(false))
    resetPort: StatePort = new StatePort("reset", false, dt.state(false))
    togglePort: StatePort = new StatePort("toggle", false, dt.state(false))
    outPort: StatePort = new StatePort("out")

    inputs: Port[] = [this.setPort, this.resetPort, this.togglePort]
    outputs: Port[] = [this.outPort]

    private stored = false
    private previousToggle = false
    private hasSeenToggle = false

    init(): void {
        // No initialization required.
    }

    cleanup(): void {
        // No cleanup required.
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const set = inputs[0]
        const reset = inputs[1]
        const toggle = inputs[2]

        if (!set || set.kind !== "state") {
            throw new Error("StateMemoryCard missing/invalid input 'set'")
        }
        if (!reset || reset.kind !== "state") {
            throw new Error("StateMemoryCard missing/invalid input 'reset'")
        }
        if (!toggle || toggle.kind !== "state") {
            throw new Error("StateMemoryCard missing/invalid input 'toggle'")
        }

        const risingToggle =
            this.hasSeenToggle && toggle.value && !this.previousToggle

        // Priority: reset, then set, then rising-edge toggle.
        if (reset.value) {
            this.stored = false
        } else if (set.value) {
            this.stored = true
        } else if (risingToggle) {
            this.stored = !this.stored
        }

        this.previousToggle = toggle.value
        this.hasSeenToggle = true
        return [dt.state(this.stored)]
    }
}
