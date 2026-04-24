import { Card } from "../cardBase/card.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import {
    ColorPort,
    ImagePort,
    ShapePort,
    VectorPort,
} from "../cardBase/ports/port.ts"

export class SampleImageColor extends Card {
    title = "sample image color"
    description =
        "what color is this pixel, or what is the average color of this region?"
    inputs = [
        new ImagePort("image", false),
        new VectorPort("positions"),
        new ShapePort("region"),
    ]
    outputs = [new ColorPort("color")]

    canvas1 = document.createElement("canvas")
    canvas2 = document.createElement("canvas")
    ctx1 = this.canvas1.getContext("2d")
    ctx2 = this.canvas2.getContext("2d")

    init() {
        if (!this.ctx1) {
            this.ctx1 = this.canvas1.getContext("2d")
        }
        if (!this.ctx2) {
            this.ctx2 = this.canvas2.getContext("2d")
            this.canvas2.width = 1
            this.canvas2.height = 1
        }
        if (!this.ctx1 || !this.ctx2) {
            throw new Error("SampleImageColor: unable to get 2D contexts")
        }
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const imageData = inputs.find((input) => input?.kind === "image")
        const positionData = inputs.find((input) => input?.kind === "vector")
        const shapeData = inputs.find((input) => input?.kind === "shape")

        if (!imageData) {
            throw new Error("SampleImageColor: image input is required")
        }

        // 1. Shape data present: compute average color in region
        // 2. Position data present: sample color at position
        // 3. Neither present: return the average color of the entire image
        const { width, height, data } = imageData.data
        if (positionData) {
            const x = Math.min(
                width,
                Math.max(0, Math.floor(positionData.value.x())),
            )
            const y = Math.min(
                height,
                Math.max(0, Math.floor(positionData.value.y())),
            )
            const index = (y * width + x) * 4
            return [
                dt.color(
                    data[index],
                    data[index + 1],
                    data[index + 2],
                    data[index + 3] / 255,
                ),
            ]
        }
        // Shape & image uses contexts
        if (!this.ctx1 || !this.ctx2) {
            throw new Error("SampleImageColor: 2D contexts not available")
        }

        if (shapeData) {
            if (shapeData.value.length === 0) {
                return [dt.color(0, 0, 0, 0)]
            }
            const region = new Path2D()
            const step = 0.01
            let open = false
            for (const curve of shapeData.value) {
                if (!open) {
                    const [startX, startY] = curve.getValue(0)
                    region.moveTo(startX, startY)
                    open = true
                }
                for (let t = step; t <= 1; t += step) {
                    const [x, y] = curve.getValue(t)
                    region.lineTo(x, y)
                }
                region.closePath()
            }
            if (!this.ctx1) {
                throw new Error("SampleImageColor: 2D context not available")
            }
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4
                const x = pixelIndex % width
                const y = Math.floor(pixelIndex / width)
                if (this.ctx1.isPointInPath(region, x, y)) {
                    // pixel is inside the region
                    continue
                }
                // set alpha to 0 to ignore this pixel
                data[i + 3] = 0
            }
        }

        // Put imageData on a canvas (as we can't resize ImageData directly)
        this.ctx1.canvas.width = width
        this.ctx1.canvas.height = height
        this.ctx1.putImageData(imageData.data, 0, 0)

        // Create a second canvas to scale down to 1x1 pixel to get average color
        this.ctx2.clearRect(0, 0, 1, 1)
        this.ctx2.drawImage(this.canvas1, 0, 0, 1, 1)
        const avgData = this.ctx2.getImageData(0, 0, 1, 1).data
        return [dt.color(avgData[0], avgData[1], avgData[2], avgData[3] / 255)]
    }

    cleanup() {}
}
