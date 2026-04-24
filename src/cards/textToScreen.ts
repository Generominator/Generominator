import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { TextPort, type Port } from "../cardBase/ports/port"

export class TextToScreenCard extends Card {
    description: string
    inputs: Port[]
    outputs: Port[]
    title: string
    private containerDiv: HTMLDivElement | null = null

    constructor() {
        super()
        this.title = "Text to Screen"
        this.description = "Displays a text on the screen."

        this.inputs = [new TextPort("text", false)]
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
        if (input.kind !== "text") {
            throw new Error(
                `Text To Screen expects a string input, got: ${JSON.stringify(inputs)}`,
            )
        }
        this.containerDiv.innerHTML = input.value

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
