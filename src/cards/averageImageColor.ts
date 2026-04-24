import { Card } from "../cardBase/card.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import { ColorPort, ImagePort } from "../cardBase/ports/port.ts"

export class AverageImageColor extends Card {
    title = "average image color"
    description = "Returns the average color of an image."
    inputs = [new ImagePort("image", false)]
    outputs = [new ColorPort("color")]

    canvas1 = document.createElement("canvas")
    canvas2 = document.createElement("canvas")
    ctx1 = this.canvas1.getContext("2d")
    ctx2 = this.canvas2.getContext("2d")

    init() {
        if (!this.ctx1) this.ctx1 = this.canvas1.getContext("2d")
        if (!this.ctx2) {
            this.ctx2 = this.canvas2.getContext("2d")
            this.canvas2.width = 1
            this.canvas2.height = 1
        }
        if (!this.ctx1 || !this.ctx2)
            throw new Error("AverageImageColor: unable to get 2D contexts")
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const imageInput = inputs.find(
            (i): i is Extract<DataType, { kind: "image" }> =>
                i.kind === "image",
        )
        if (!imageInput)
            throw new Error("AverageImageColor: image input is required")
        if (!this.ctx1 || !this.ctx2)
            throw new Error("AverageImageColor: 2D contexts not available")

        const { width, height } = imageInput.data
        this.ctx1.canvas.width = width
        this.ctx1.canvas.height = height
        this.ctx1.putImageData(imageInput.data, 0, 0)

        this.ctx2.clearRect(0, 0, 1, 1)
        this.ctx2.drawImage(this.canvas1, 0, 0, 1, 1)
        const avg = this.ctx2.getImageData(0, 0, 1, 1).data
        return [dt.color(avg[0], avg[1], avg[2], avg[3] / 255)]
    }

    cleanup() {}
}

export default AverageImageColor
