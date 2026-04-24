import { Card } from "../cardBase/card"
import { dt, type DataType } from "../cardBase/dataTypes"
import { ImagePort, ValuePort, type Port } from "../cardBase/ports/port"

function kMeans(samples: number[][], k: number): number[][] {
    // Init: pick k random samples as initial centroids
    const centroids: number[][] = []
    const used = new Set<number>()
    while (centroids.length < k) {
        const idx = Math.floor(Math.random() * samples.length)
        if (!used.has(idx)) {
            used.add(idx)
            centroids.push([...samples[idx]])
        }
    }

    for (let iter = 0; iter < 10; iter++) {
        const sums: number[][] = Array.from({ length: k }, () => [0, 0, 0])
        const counts: number[] = new Array(k).fill(0)

        for (const s of samples) {
            let best = 0
            let bestDist = Infinity
            for (let c = 0; c < k; c++) {
                const dr = s[0] - centroids[c][0]
                const dg = s[1] - centroids[c][1]
                const db = s[2] - centroids[c][2]
                const dist = dr * dr + dg * dg + db * db
                if (dist < bestDist) {
                    bestDist = dist
                    best = c
                }
            }
            sums[best][0] += s[0]
            sums[best][1] += s[1]
            sums[best][2] += s[2]
            counts[best]++
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                centroids[c][0] = sums[c][0] / counts[c]
                centroids[c][1] = sums[c][1] / counts[c]
                centroids[c][2] = sums[c][2] / counts[c]
            }
        }
    }

    return centroids
}

export class Posterize extends Card {
    title = "Posterize"
    description =
        "Reduce the image to N colors using k-means color quantisation."
    inputs: Port[] = [
        new ImagePort("image", false),
        new ValuePort("color count", false, dt.value(8)),
    ]
    outputs: Port[] = [new ImagePort("posterized image")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const imageInput = inputs.find(
            (i): i is Extract<DataType, { kind: "image" }> =>
                i.kind === "image",
        )
        const valueInput = inputs.find(
            (i): i is Extract<DataType, { kind: "value" }> =>
                i.kind === "value",
        )

        if (!imageInput) {
            throw new Error("Posterize: image input is required")
        }

        const colorCount = valueInput?.value ?? 8
        const k = Math.max(2, Math.min(64, Math.round(colorCount)))

        const { width, height, data } = imageInput.data

        // Sample up to 5000 random pixels
        const totalPixels = width * height
        const sampleCount = Math.min(5000, totalPixels)
        const samples: number[][] = []
        for (let i = 0; i < sampleCount; i++) {
            const idx = Math.floor(Math.random() * totalPixels) * 4
            samples.push([data[idx], data[idx + 1], data[idx + 2]])
        }

        const centroids = kMeans(samples, k)

        // Map every pixel to its nearest centroid
        const output = new Uint8ClampedArray(data.length)
        for (let i = 0; i < totalPixels; i++) {
            const pi = i * 4
            const r = data[pi]
            const g = data[pi + 1]
            const b = data[pi + 2]
            const a = data[pi + 3]

            let best = 0
            let bestDist = Infinity
            for (let c = 0; c < k; c++) {
                const dr = r - centroids[c][0]
                const dg = g - centroids[c][1]
                const db = b - centroids[c][2]
                const dist = dr * dr + dg * dg + db * db
                if (dist < bestDist) {
                    bestDist = dist
                    best = c
                }
            }

            output[pi] = Math.round(centroids[best][0])
            output[pi + 1] = Math.round(centroids[best][1])
            output[pi + 2] = Math.round(centroids[best][2])
            output[pi + 3] = a
        }

        return [dt.image(new ImageData(output, width, height))]
    }

    init(): void {}
    cleanup(): void {}
}

export default Posterize
