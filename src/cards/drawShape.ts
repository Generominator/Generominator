import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ImagePort, ShapePort, type Port } from "../cardBase/ports/port"

export class DrawShape extends Card {
    title = "Draw Shape"
    description =
        "Draw a shape to an image, filling closed curves with their color."
    inputs: Port[] = [new ShapePort("shape")]
    outputs: Port[] = [new ImagePort("image")]

    canvas = document.createElement("canvas")

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is Extract<DataType, { kind: "shape" }> =>
                i.kind === "shape",
        )

        if (!shapeInput || shapeInput.value.length === 0) {
            this.canvas.width = 1
            this.canvas.height = 1
            const emptyCtx = this.canvas.getContext("2d")!
            return [dt.image(emptyCtx.getImageData(0, 0, 1, 1))]
        }

        const curves = shapeInput.value
        const step = 0.01
        const padding = 10

        // Compute bounding box
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity

        for (const curve of curves) {
            for (let t = 0; t <= 1; t += step) {
                const [x, y] = curve.getValue(t)
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }

        if (!isFinite(minX)) {
            this.canvas.width = 1
            this.canvas.height = 1
            const emptyCtx = this.canvas.getContext("2d")!
            return [dt.image(emptyCtx.getImageData(0, 0, 1, 1))]
        }

        let canvasW = maxX - minX + padding * 2
        let canvasH = maxY - minY + padding * 2

        // Scale to fit if either dimension > 2048
        if (canvasW > 2048 || canvasH > 2048) {
            const s = 2048 / Math.max(canvasW, canvasH)
            canvasW = Math.round(canvasW * s)
            canvasH = Math.round(canvasH * s)
        }

        this.canvas.width = Math.max(1, Math.round(canvasW))
        this.canvas.height = Math.max(1, Math.round(canvasH))

        const ctx = this.canvas.getContext("2d")
        if (!ctx) throw new Error("DrawShape: cannot get 2D context")

        const scaleX = this.canvas.width / (maxX - minX + padding * 2)
        const scaleY = this.canvas.height / (maxY - minY + padding * 2)

        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        for (const curve of curves) {
            const path = new Path2D()
            const [x0, y0] = curve.getValue(0)
            path.moveTo(
                (x0 - minX + padding) * scaleX,
                (y0 - minY + padding) * scaleY,
            )

            for (let t = step; t <= 1; t += step) {
                const [x, y] = curve.getValue(t)
                path.lineTo(
                    (x - minX + padding) * scaleX,
                    (y - minY + padding) * scaleY,
                )
            }

            const [r, g, b, a] = curve.color ?? [255, 255, 255, 1]
            const cssColor = `rgba(${r},${g},${b},${a})`

            if (curve.closed) {
                path.closePath()
                ctx.fillStyle = cssColor
                ctx.fill(path)
            } else {
                ctx.strokeStyle = cssColor
                ctx.lineWidth = 1
                ctx.stroke(path)
            }
        }

        return [
            dt.image(
                ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
            ),
        ]
    }

    init(): void {}
    cleanup(): void {}
}

export default DrawShape
