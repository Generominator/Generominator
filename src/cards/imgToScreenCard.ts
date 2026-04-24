import { Card } from "../cardBase/card"
import { type DataType } from "../cardBase/dataTypes"
import { ImagePort, type Port } from "../cardBase/ports/port"

export class ImgToScreenCard extends Card {
    description: string
    inputs: Port[]
    outputs: Port[]
    title: string
    private containerDiv: HTMLDivElement | null = null
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null

    constructor() {
        super()
        this.title = "Img to Screen"
        this.description = "Displays an image on the screen."
        this.inputs = [new ImagePort("image", false)]
        this.outputs = []
    }

    cleanup(): void {
        this.containerDiv = null
        this.canvas = null
        this.ctx = null
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.canvas || !this.ctx) return []

        const imageData: DataType = inputs[0]
        if (imageData && imageData.kind === "image") {
            const data = imageData.data
            if (
                this.canvas.width !== data.width ||
                this.canvas.height !== data.height
            ) {
                this.canvas.width = data.width
                this.canvas.height = data.height
            }
            this.ctx.putImageData(data, 0, 0)
        }
        return []
    }

    init(): void {
        // We should not let cardBase just modify the dom directly. If we want cool previews on the card, we should have some card
        // preview div that the card can optionally render to. In other words, this is bad imo.
        if (!this.containerDiv) {
            this.containerDiv = document.createElement("div")
            this.canvas = document.createElement("canvas")
            this.ctx = this.canvas.getContext("2d")
            this.containerDiv.appendChild(this.canvas)
            document.getElementById("card-data")?.appendChild(this.containerDiv)
        }
    }
}
