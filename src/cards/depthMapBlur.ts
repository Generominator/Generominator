import { Card } from "../cardBase/card.ts"
import { type Port, DepthMapPort, ValuePort } from "../cardBase/ports/port.ts"
import { type DataType, type DataTypeOf, dt } from "../cardBase/dataTypes.ts"

function buildGaussianKernel(k: number, sigma: number): number[] {
    const kernel: number[] = []
    const half = Math.floor(k / 2)
    let sum = 0
    for (let y = -half; y <= half; y++) {
        for (let x = -half; x <= half; x++) {
            const v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma))
            kernel.push(v)
            sum += v
        }
    }
    return kernel.map((v) => v / sum)
}

export class DepthMapBlur extends Card {
    title = "Depth Map Blur"
    description = "Applies a Gaussian blur to a depth map to smooth noise."
    inputs: Port[] = [
        new DepthMapPort("depth map", false),
        new ValuePort("kernel size", false, dt.value(3)),
    ]
    outputs: Port[] = [new DepthMapPort("blurred depth map")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const depthmap = inputs.find(
            (i): i is DataTypeOf<"depthmap"> => i.kind === "depthmap",
        )
        if (!depthmap) {
            throw new Error("Depth Map Blur requires a depth map input")
        }

        const valInput = inputs.find(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )
        let k = Math.round(valInput?.value ?? 3)
        if (k < 1) k = 1
        if (k % 2 === 0) k += 1

        const { values, width, height } = depthmap
        const sigma = k / 6
        const kernel = buildGaussianKernel(k, sigma)
        const half = Math.floor(k / 2)

        const output = new Array<number>(values.length)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let acc = 0
                let ki = 0
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const sy = Math.max(0, Math.min(height - 1, y + ky))
                        const sx = Math.max(0, Math.min(width - 1, x + kx))
                        acc += values[sy * width + sx] * kernel[ki]
                        ki++
                    }
                }
                output[y * width + x] = Math.max(0, Math.min(255, acc))
            }
        }

        return [dt.depthmap(output, width, height)]
    }

    init(): void {}
    cleanup(): void {}
}
