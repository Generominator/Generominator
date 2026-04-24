import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { DepthMapPort, ImagePort, type Port } from "../cardBase/ports/port"

/**
 * Implements the Split Image Into Color Channels Card.
 *
 * @remarks While I *think* a depthmap is an image, so the values
 * returned here could be of type `ImageData` that felt really big for
 * data that's supposed to be just one channel anyways (e.g., why track
 * RGBA when I only care about R?). So we can argue about implementation I suppose.
 *
 * @see https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color -
 *    brightness formula
 * @see https://stackoverflow.com/questions/23090019/fastest-formula-to-get-hue-from-rgb - hue formula
 */
export class SplitImageIntoColorChannels extends Card {
    title = "Split Image Into Color Channels"
    description = "Splits a given image into 2D data channels"

    inputs: Port[] = [new ImagePort("source image", false)]
    outputs: Port[] = [
        new DepthMapPort("hue"),
        new DepthMapPort("brightness"),
        new DepthMapPort("red"),
        new DepthMapPort("green"),
        new DepthMapPort("blue"),
    ]

    constructor() {
        super()
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const imageInput = inputs[0] as DataTypeOf<"image">

        if (!imageInput || imageInput.kind !== "image") {
            // Return some dummy values if bad input
            return Array(5).fill({
                kind: "depthmap",
                values: [],
                width: 0,
                height: 0,
            })
        }

        const { data, width, height } = imageInput.data
        const pixelCount = width * height

        const redChannel = new Float32Array(pixelCount)
        const greenChannel = new Float32Array(pixelCount)
        const blueChannel = new Float32Array(pixelCount)
        const hueChannel = new Float32Array(pixelCount)
        const brightnessChannel = new Float32Array(pixelCount)

        for (let i = 0; i < pixelCount; i++) {
            // Because data is a flat list, a pixel is stored as four consecutive values (RGBA)
            // so we want to make sure we skip by 4 on each for loop iteration
            const idx = i * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]

            // Save rgb
            redChannel[i] = r
            greenChannel[i] = g
            blueChannel[i] = b

            // Calculate brightness
            brightnessChannel[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b

            // Calculate hue
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            const delta = max - min
            let hue = 0

            if (delta !== 0) {
                if (max === r) hue = (g - b) / delta
                else if (max === g) hue = (b - r) / delta + 2
                else hue = (r - g) / delta + 4

                hue = Math.round(hue * 60)
                if (hue < 0) hue += 360
            }
            hueChannel[i] = hue
        }

        // We can discuss if my depthmap structure makes sense
        return [
            dt.depthmap(Array.from(hueChannel), width, height),
            dt.depthmap(Array.from(brightnessChannel), width, height),
            dt.depthmap(Array.from(redChannel), width, height),
            dt.depthmap(Array.from(greenChannel), width, height),
            dt.depthmap(Array.from(blueChannel), width, height),
        ]
    }

    init(): void {}
    cleanup(): void {}
}
