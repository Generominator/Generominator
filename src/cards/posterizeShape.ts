import { Card } from "../cardBase/card"
import { dt, PolygonCurve, type DataType } from "../cardBase/dataTypes"
import {
    ImagePort,
    ShapePort,
    ValuePort,
    ColorPort,
    type Port,
} from "../cardBase/ports/port"

function kMeansRGB(samples: number[][], k: number): number[][] {
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

function nearestCentroid(
    r: number,
    g: number,
    b: number,
    centroids: number[][],
): number {
    let best = 0
    let bestDist = Infinity
    for (let c = 0; c < centroids.length; c++) {
        const dr = r - centroids[c][0]
        const dg = g - centroids[c][1]
        const db = b - centroids[c][2]
        const dist = dr * dr + dg * dg + db * db
        if (dist < bestDist) {
            bestDist = dist
            best = c
        }
    }
    return best
}

export class PosterizeShape extends Card {
    title = "Posterize Shape"
    description =
        "Quantise image colors and trace region boundaries as a colored shape."
    inputs: Port[] = [
        new ImagePort("image", false),
        new ValuePort("color count", false, dt.value(8)),
        new ColorPort("filter color", true),
    ]
    outputs: Port[] = [new ShapePort("shape")]

    canvas = document.createElement("canvas")

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
            throw new Error("PosterizeShape: image input is required")
        }

        const colorCount = valueInput?.value ?? 8
        const k = Math.max(2, Math.min(64, Math.round(colorCount)))

        // Scale image down to ≤ 256 px on longest side
        const srcW = imageInput.data.width
        const srcH = imageInput.data.height
        const maxDim = 256
        const scale = Math.min(1, maxDim / Math.max(srcW, srcH))
        const w = Math.max(1, Math.round(srcW * scale))
        const h = Math.max(1, Math.round(srcH * scale))

        this.canvas.width = w
        this.canvas.height = h
        const ctx = this.canvas.getContext("2d")
        if (!ctx) throw new Error("PosterizeShape: cannot get 2D context")

        // Draw scaled image
        const tmpCanvas = document.createElement("canvas")
        tmpCanvas.width = srcW
        tmpCanvas.height = srcH
        const tmpCtx = tmpCanvas.getContext("2d")!
        tmpCtx.putImageData(imageInput.data, 0, 0)
        ctx.drawImage(tmpCanvas, 0, 0, srcW, srcH, 0, 0, w, h)
        const imgData = ctx.getImageData(0, 0, w, h)
        const data = imgData.data

        // Sample up to 5000 pixels for k-means
        const totalPixels = w * h
        const sampleCount = Math.min(5000, totalPixels)
        const samples: number[][] = []
        for (let i = 0; i < sampleCount; i++) {
            const idx = Math.floor(Math.random() * totalPixels) * 4
            samples.push([data[idx], data[idx + 1], data[idx + 2]])
        }

        const centroids = kMeansRGB(samples, k)

        const colorInput = inputs.find(
            (i): i is Extract<DataType, { kind: "color" }> =>
                i != null && i.kind === "color",
        )
        const filterCentroidIndex =
            colorInput !== undefined
                ? nearestCentroid(
                      colorInput.r,
                      colorInput.g,
                      colorInput.b,
                      centroids,
                  )
                : null

        // Build color index map
        const colorIndex = new Uint8Array(totalPixels)
        for (let i = 0; i < totalPixels; i++) {
            const pi = i * 4
            colorIndex[i] = nearestCentroid(
                data[pi],
                data[pi + 1],
                data[pi + 2],
                centroids,
            )
        }

        // BFS connected-component labelling (4-connectivity)
        const labels = new Int32Array(totalPixels).fill(-1)
        const components: {
            centroidIndex: number
            pixels: [number, number][]
        }[] = []
        let nextLabel = 0

        for (let startY = 0; startY < h; startY++) {
            for (let startX = 0; startX < w; startX++) {
                const startIdx = startY * w + startX
                if (labels[startIdx] !== -1) continue

                const ci = colorIndex[startIdx]
                const label = nextLabel++
                const pixels: [number, number][] = []
                const queue: number[] = [startIdx]
                labels[startIdx] = label

                let head = 0
                while (head < queue.length) {
                    const idx = queue[head++]
                    const px = idx % w
                    const py = Math.floor(idx / w)
                    pixels.push([px, py])

                    // 4-neighbors
                    const neighbors = [
                        px > 0 ? idx - 1 : -1,
                        px < w - 1 ? idx + 1 : -1,
                        py > 0 ? idx - w : -1,
                        py < h - 1 ? idx + w : -1,
                    ]
                    for (const n of neighbors) {
                        if (
                            n >= 0 &&
                            labels[n] === -1 &&
                            colorIndex[n] === ci
                        ) {
                            labels[n] = label
                            queue.push(n)
                        }
                    }
                }

                components.push({ centroidIndex: ci, pixels })
            }
        }

        // Trace boundaries and build PolygonCurves
        const curves: PolygonCurve[] = []

        // Clockwise Moore directions: E SE S SW W NW N NE
        const dx = [1, 1, 0, -1, -1, -1, 0, 1]
        const dy = [0, 1, 1, 1, 0, -1, -1, -1]

        // dirArr[ddx+1][ddy+1]: maps delta of consecutive directions → direction index
        const dirArr: number[][] = Array.from({ length: 3 }, () =>
            new Array(3).fill(0),
        )
        for (let d = 0; d < 8; d++) dirArr[dx[d] + 1][dy[d] + 1] = d

        for (const comp of components) {
            if (comp.pixels.length < 16) continue
            if (
                filterCentroidIndex !== null &&
                comp.centroidIndex !== filterCentroidIndex
            )
                continue

            // Moore-neighbor boundary walk (correct)
            const isFg = (x: number, y: number) =>
                x >= 0 &&
                x < w &&
                y >= 0 &&
                y < h &&
                colorIndex[y * w + x] === comp.centroidIndex

            // Use topmost-leftmost BFS pixel as start; its west neighbor is always background
            const [sx, sy] = comp.pixels[0]
            let bx = sx,
                by = sy
            let cDir = 4 // direction from start to its west neighbor (always background)
            const boundary: [number, number][] = [[bx, by]]

            for (let step = 0; step < w * h; step++) {
                let lastBgDir = cDir
                let nextBx = -1,
                    nextBy = -1,
                    nextCDir = cDir

                for (let d = 0; d < 8; d++) {
                    const checkDir = (cDir + d) % 8
                    const nx = bx + dx[checkDir]
                    const ny = by + dy[checkDir]
                    if (isFg(nx, ny)) {
                        nextCDir =
                            dirArr[dx[lastBgDir] - dx[checkDir] + 1][
                                dy[lastBgDir] - dy[checkDir] + 1
                            ]
                        nextBx = nx
                        nextBy = ny
                        break
                    }
                    lastBgDir = checkDir // update even for OOB (treated as background)
                }

                if (nextBx === -1) break // isolated pixel
                bx = nextBx
                by = nextBy
                cDir = nextCDir
                if (bx === sx && by === sy) break // completed loop
                boundary.push([bx, by])
            }

            if (boundary.length < 3) continue

            // Downsample: keep every ⌈len/512⌉-th point
            const step = Math.ceil(boundary.length / 512)
            const pts: [number, number][] = []
            for (let i = 0; i < boundary.length; i += step) {
                const [px, py] = boundary[i]
                pts.push([px * (srcW / w), py * (srcH / h)])
            }

            const c = centroids[comp.centroidIndex]
            const color: [number, number, number, number] = [
                Math.round(c[0]),
                Math.round(c[1]),
                Math.round(c[2]),
                1,
            ]

            curves.push(new PolygonCurve(pts, color, true))
        }

        return [dt.shape(curves)]
    }

    init(): void {}
    cleanup(): void {}
}

export default PosterizeShape
