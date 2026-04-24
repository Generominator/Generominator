import { Card } from "../cardBase/card.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import { ImagePort, ShapePort } from "../cardBase/ports/port.ts"

export class MaskImage extends Card {
    title = "mask image"
    description =
        "Clips an image to a shape; pixels outside the shape are transparent or filled by an optional background image."
    inputs = [
        new ImagePort("image", false), // index 0 — source image (required)
        new ShapePort("shape", false), // index 1 — mask shape  (required)
        new ImagePort("background"), // index 2 — background  (optional)
    ]
    outputs = [new ImagePort("result")]

    workCanvas = document.createElement("canvas")
    auxCanvas = document.createElement("canvas")
    workCtx = this.workCanvas.getContext("2d")
    auxCtx = this.auxCanvas.getContext("2d")

    init() {
        if (!this.workCtx) this.workCtx = this.workCanvas.getContext("2d")
        if (!this.auxCtx) this.auxCtx = this.auxCanvas.getContext("2d")
        if (!this.workCtx || !this.auxCtx)
            throw new Error("MaskImage: unable to get 2D contexts")
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        // Indexed by port position (execEngine stores inputs[e.inIdx] = value)
        const imageInput = inputs[0]
        const shapeInput = inputs[1]
        const backgroundInput = inputs[2] // may be undefined

        if (!imageInput || imageInput.kind !== "image")
            throw new Error("MaskImage: image input is required")
        if (!shapeInput || shapeInput.kind !== "shape")
            throw new Error("MaskImage: shape input is required")
        if (!this.workCtx || !this.auxCtx)
            throw new Error("MaskImage: 2D contexts not available")

        const { width, height } = imageInput.data

        // Build clip path from shape curves (same pattern as sampleImageColor.ts:81–94)
        const clipPath = new Path2D()
        const step = 0.01
        for (const curve of shapeInput.value) {
            const [sx, sy] = curve.getValue(0)
            clipPath.moveTo(sx, sy)
            for (let t = step; t <= 1; t += step) {
                const [x, y] = curve.getValue(t)
                clipPath.lineTo(x, y)
            }
            clipPath.closePath()
        }

        // Setting canvas.width clears the canvas — output size matches source image
        this.workCanvas.width = width
        this.workCanvas.height = height

        // 1. Draw background first (if provided), scaled to output dimensions
        if (backgroundInput && backgroundInput.kind === "image") {
            this.auxCanvas.width = backgroundInput.data.width
            this.auxCanvas.height = backgroundInput.data.height
            this.auxCtx.putImageData(backgroundInput.data, 0, 0)
            this.workCtx.drawImage(this.auxCanvas, 0, 0, width, height)
        }

        // 2. Clip to shape, then draw source image on top
        this.auxCanvas.width = width
        this.auxCanvas.height = height
        this.auxCtx.putImageData(imageInput.data, 0, 0)

        this.workCtx.save()
        this.workCtx.clip(clipPath)
        this.workCtx.drawImage(this.auxCanvas, 0, 0)
        this.workCtx.restore()

        return [dt.image(this.workCtx.getImageData(0, 0, width, height))]
    }

    cleanup() {}
}

export default MaskImage
