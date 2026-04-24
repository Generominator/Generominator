import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { ImagePort, ValuePort, type Port } from "../cardBase/ports/port"

/**
 * Implements the Frame Difference card.
 *
 * Compares the current image frame to the previous one and outputs a
 * grayscale image highlighting changed pixels. Useful for motion detection,
 * optical flow visualization, and frame-delta effects in generative pipelines.
 */
export class FrameDifference extends Card {
    title = "Frame Difference"
    description =
        "Outputs a grayscale image highlighting pixels that changed between the current and previous frame"

    inputs: Port[] = [
        new ImagePort("image", false),
        new ValuePort("epsilon", false, dt.value(0.25)),
    ]
    outputs: Port[] = [new ImagePort("difference")]

    private previousFrameData: Uint8ClampedArray | null = null
    private outputBuffer: Uint8ClampedArray | null = null

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const imageInput = inputs.find(
            (input): input is DataTypeOf<"image"> => input.kind === "image",
        )

        if (!imageInput) {
            throw new Error("FrameDifference: required image input is missing")
        }

        const valueInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )
        const epsilon = valueInput?.value ?? 0.25

        const { width, height } = imageInput.data
        const currentData = imageInput.data.data
        const needed = width * height * 4

        if (!this.outputBuffer || this.outputBuffer.length !== needed) {
            this.outputBuffer = new Uint8ClampedArray(needed)
        }
        const outputData = this.outputBuffer

        if (
            this.previousFrameData === null ||
            this.previousFrameData.length !== needed
        ) {
            // First frame or dimension change: output black image
            outputData.fill(0)
            for (let i = 3; i < outputData.length; i += 4) {
                outputData[i] = 255
            }
        } else {
            const prevData = this.previousFrameData

            for (let i = 0; i < width * height; i++) {
                const idx = i * 4
                const r1 = currentData[idx]
                const g1 = currentData[idx + 1]
                const b1 = currentData[idx + 2]
                const r2 = prevData[idx]
                const g2 = prevData[idx + 1]
                const b2 = prevData[idx + 2]

                const diff =
                    (Math.abs(r1 - r2) +
                        Math.abs(g1 - g2) +
                        Math.abs(b1 - b2)) /
                    (3 * 255)

                let brightness: number
                if (epsilon === 0) {
                    brightness = diff > 0 ? 255 : 0
                } else {
                    brightness = Math.min(1, Math.max(0, diff / epsilon)) * 255
                }

                outputData[idx] = brightness
                outputData[idx + 1] = brightness
                outputData[idx + 2] = brightness
                outputData[idx + 3] = 255
            }
        }

        if (
            !this.previousFrameData ||
            this.previousFrameData.length !== needed
        ) {
            this.previousFrameData = new Uint8ClampedArray(currentData)
        } else {
            this.previousFrameData.set(currentData)
        }

        return [
            dt.image(
                new ImageData(new Uint8ClampedArray(outputData), width, height),
            ),
        ]
    }

    init(): void {}

    cleanup(): void {
        this.previousFrameData = null
        this.outputBuffer = null
    }
}
