import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import {
    CurvePort,
    ImagePort,
    ShapePort,
    type Port,
} from "../cardBase/ports/port"

function drawShape(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    shape: DataTypeOf<"shape">,
): HTMLCanvasElement {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    canvas.width = 500
    canvas.height = 500
    const step = 0.01

    for (const curve of shape.value) {
        for (let t = 0; t <= 1; t += step) {
            const [x, y] = curve.getValue(t)
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }

    const shapeWidth = maxX - minX
    const shapeHeight = maxY - minY
    const scale = Math.min(
        (canvas.width - 20) / shapeWidth,
        (canvas.height - 20) / shapeHeight,
    )

    // draw shape
    ctx.strokeStyle = "white"
    const region = new Path2D()
    let startedCurve = false
    for (const curve of shape.value) {
        if (!startedCurve) {
            const [x0, y0] = curve.getValue(0)
            region.moveTo(
                (x0 - minX) * scale + 10,
                canvas.height - ((y0 - minY) * scale + 10),
            )
            startedCurve = true
        }

        for (let t = 0; t <= 1; t += step) {
            const [x, y] = curve.getValue(t)
            region.lineTo(
                (x - minX) * scale + 10,
                canvas.height - ((y - minY) * scale + 10),
            )
        }
    }
    region.closePath()
    ctx.fillStyle = "white"
    ctx.fill(region, "evenodd")

    return canvas
}

export class DrawCurves extends Card {
    title = "Draw Curves"
    description =
        "Draw the shape of curves; a smooth line, or a trail of stamped images or shapes"
    inputs: Port[] = [
        new CurvePort("target curve", false),
        new ImagePort("image to stamp"),
        new ShapePort("shape to stamp"),
    ]
    outputs: Port[] = [new ImagePort("output image")]
    canvas = document.createElement("canvas")
    ctx = this.canvas.getContext("2d")
    offset: [number, number] = [0, 0]

    private toCanvasCoord(x: number, y: number): [number, number] {
        return [
            x + this.offset[0] + this.canvas.width / 2,
            this.canvas.height / 2 - this.offset[1] - y,
        ]
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.ctx) {
            throw new Error("DrawCurves error: 2D context not available")
        }
        const curve = inputs.find(
            (input): input is DataTypeOf<"curve"> => input?.kind === "curve",
        )
        const image = inputs.find(
            (input): input is DataTypeOf<"image"> => input?.kind === "image",
        )
        const shape = inputs.find(
            (input): input is DataTypeOf<"shape"> => input?.kind === "shape",
        )
        if (!curve) {
            throw new Error("DrawCurves requires a curve input")
        }

        const step = 0.01

        // get bounding box of the curve
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        for (let t = 0; t <= 1; t += step) {
            const [x, y] = curve.value.getValue(t)
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.canvas.width = maxX - minX + 20
        this.canvas.height = maxY - minY + 20
        this.offset = [
            -(minX + (maxX - minX) / 2) + 10,
            -(minY + (maxY - minY) / 2) + 10,
        ]

        if (!image && !shape) {
            // Draw the curve
            this.ctx.strokeStyle = "white"
            const [x0, y0] = curve.value.getValue(0)
            this.ctx.moveTo(...this.toCanvasCoord(x0, y0))
            this.ctx.beginPath()
            for (let t = 0; t < 1; t += step) {
                const [x, y] = curve.value.getValue(t)
                this.ctx.lineTo(...this.toCanvasCoord(x, y))
            }
            this.ctx.stroke()
        } else if (image || shape) {
            const imageCanvas = document.createElement("canvas")
            const imageCtx = imageCanvas.getContext("2d")
            if (!imageCtx) {
                throw new Error("DrawCurves error: 2D context not available")
            }
            if (image) {
                imageCanvas.width = image.data.width
                imageCanvas.height = image.data.height
                imageCtx.putImageData(image.data, 0, 0)
            } else if (shape) {
                drawShape(imageCanvas, imageCtx, shape)
            }
            const maxDimension =
                Math.min(imageCanvas.width, imageCanvas.height) / 3
            let scale = 1
            if (
                imageCanvas.width > maxDimension ||
                imageCanvas.height > maxDimension
            ) {
                scale = Math.min(
                    maxDimension / imageCanvas.width,
                    maxDimension / imageCanvas.height,
                )
            }

            // Draw stamped images along the curve
            for (let t = 0; t < 1; t += step) {
                const [x, y] = curve.value.getValue(t)
                this.ctx.drawImage(
                    imageCanvas,
                    ...this.toCanvasCoord(
                        x - (imageCanvas.width * scale) / 2,
                        y - (imageCanvas.height * scale) / 2,
                    ),
                    imageCanvas.width * scale,
                    imageCanvas.height * scale,
                )
            }
        }

        return [
            dt.image(
                this.ctx.getImageData(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height,
                ),
            ),
        ]
    }

    init(): void {}
    cleanup(): void {}
}

export default DrawCurves
