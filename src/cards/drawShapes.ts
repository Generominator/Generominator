import { Card } from "../cardBase/card"
import {
    dt,
    type DataType,
    type DataTypeOf,
    type Curve,
} from "../cardBase/dataTypes"
import {
    ShapePort,
    ColorPort,
    VectorPort,
    ImagePort,
    type Port,
} from "../cardBase/ports/port"

export class DrawShapes extends Card {
    title = "Draw Shapes"
    description =
        "Draw a shape at a specified position with a specified color to an image"
    inputs: Port[] = [
        new ShapePort("shape", false),
        new ColorPort("color", false, dt.color(255, 255, 255, 1)),
        new VectorPort("position", false, dt.vector([0, 0])),
    ]
    outputs: Port[] = [new ImagePort("output image")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        //Retrieve the three inputs given
        const shape = inputs.find(
            (input): input is DataTypeOf<"shape"> => input.kind === "shape",
        )
        const color = inputs.find(
            (input): input is DataTypeOf<"color"> => input.kind === "color",
        )
        const position =
            inputs.find(
                (input): input is DataTypeOf<"vector"> =>
                    input.kind === "vector",
            ) ?? dt.vector([0, 0])

        //Check that shape and color are proper inputs, position has a default of (0,0)
        if (!shape) {
            throw new Error("DrawShapes requires a shape input")
        }
        if (!color) {
            throw new Error("DrawShapes requires a color input")
        }

        //Make sure a canvas can be created in a 2D context
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            throw new Error("DrawShapes error: 2D context not available")
        }

        // Get bounding box of the shape, not 100% sure how bounding works but it draws consistently and correclty so I will let it be
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        const step = 0.01

        //Check all points along the curve to find bounding box
        const curves = shape.value as Curve[]
        for (const curve of curves) {
            for (let t = 0; t <= 1; t += step) {
                const [x, y] = curve.getValue(t)
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }

        // Fixed canvas size
        canvas.width = 500
        canvas.height = 500

        // Position is absolute within the 500x500 canvas
        const posX = position.value.x()
        const posY = position.value.y()

        // Calculate shape center and dimensions
        const shapeCenterX = (minX + maxX) / 2
        const shapeCenterY = (minY + maxY) / 2
        const shapeWidth = maxX - minX
        const shapeHeight = maxY - minY

        // Auto-scale small shapes to be visible (minimum 50 pixels)
        const minSize = 50
        const maxDimension = Math.max(shapeWidth, shapeHeight)
        const scale = maxDimension < minSize ? minSize / maxDimension : 1

        // Set up color
        const colorStr = `rgba(${Math.round(color.r * 255)}, ${Math.round(
            color.g * 255,
        )}, ${Math.round(color.b * 255)}, ${color.a})`
        ctx.fillStyle = colorStr

        // Create a path to draw the filled shape
        const region = new Path2D()
        let startedCurve = false

        // Iterate through each curve in the shape
        for (const curve of curves) {
            // Move to the start of the first curve
            if (!startedCurve) {
                const [x0, y0] = curve.getValue(0)
                region.moveTo(
                    posX + (x0 - shapeCenterX) * scale,
                    canvas.height - (posY + (y0 - shapeCenterY) * scale),
                )
                startedCurve = true
            }

            // Sample the curve and draw line segments to approximate the smooth curve
            for (let t = 0; t <= 1; t += step) {
                const [x, y] = curve.getValue(t)
                region.lineTo(
                    posX + (x - shapeCenterX) * scale,
                    canvas.height - (posY + (y - shapeCenterY) * scale),
                )
            }
        }

        // Close the path and fill the shape with the specified color
        region.closePath()
        ctx.fill(region, "evenodd")

        return [dt.image(ctx.getImageData(0, 0, canvas.width, canvas.height))]
    }

    init(): void {}
    cleanup(): void {}
}

export default DrawShapes
