import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { ValuePort, type Port } from "../cardBase/ports/port"

export class ValueToScreenCard extends Card {
    description: string
    inputs: Port[]
    outputs: Port[]
    title: string
    private containerDiv: HTMLDivElement | null = null

    constructor() {
        super()
        this.title = "Value to Screen"
        this.description = "Displays an number on the screen."

        this.inputs = [new ValuePort("value", false)]
        this.outputs = [] // I think these should be optionals.
    }

    cleanup(): void {
        if (this.containerDiv && this.containerDiv.parentNode) {
            this.containerDiv.parentNode.removeChild(this.containerDiv)
        }
        this.containerDiv = null
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.containerDiv) return []
        const input = inputs[0]
        if (input === null || input === undefined) {
            this.containerDiv.innerHTML = ""
            return []
        }
        if (input.kind !== "value") {
            throw new Error(
                `Value To Screen expects a value input, got: ${JSON.stringify(inputs)}`,
            )
        }
        this.containerDiv.innerHTML = input.value.toString()

        return []
    }

    init(): void {
        // We should not let cardBase just modify the dom directly. If we want cool previews on the card, we should have some card
        // preview div that the card can optionally render to. In other words, this is bad imo.
        if (!this.containerDiv) {
            this.containerDiv = document.createElement("div")
            document.getElementById("card-data")?.appendChild(this.containerDiv)
        }
    }
}
