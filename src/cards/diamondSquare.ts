import { Card } from "../cardBase/card.ts"
import { type Port, DepthMapPort, ValuePort } from "../cardBase/ports/port.ts"
import { type DataType, type DataTypeOf, dt } from "../cardBase/dataTypes.ts"

function mulberry32(seed: number): () => number {
    let s = seed >>> 0
    return () => {
        s += 0x6d2b79f5
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
    }
}

function diamondSquare(
    n: number,
    roughness: number,
    rand: () => number,
): number[] {
    const sz = (1 << n) + 1
    const grid = new Array(sz * sz).fill(0) as number[]
    const get = (x: number, y: number) => grid[y * sz + x]
    const set = (x: number, y: number, v: number) => {
        grid[y * sz + x] = v
    }

    set(0, 0, rand() * 255)
    set(sz - 1, 0, rand() * 255)
    set(0, sz - 1, rand() * 255)
    set(sz - 1, sz - 1, rand() * 255)

    let step = sz - 1
    let scale = 128

    while (step > 1) {
        const half = step >> 1

        // Diamond step: fill square centres
        for (let y = 0; y < sz - 1; y += step) {
            for (let x = 0; x < sz - 1; x += step) {
                const avg =
                    (get(x, y) +
                        get(x + step, y) +
                        get(x, y + step) +
                        get(x + step, y + step)) /
                    4
                set(x + half, y + half, avg + (rand() * 2 - 1) * scale)
            }
        }

        // Square step: fill diamond centres
        for (let y = 0; y < sz; y += half) {
            for (let x = (y + half) % step; x < sz; x += step) {
                let sum = 0,
                    count = 0
                if (y - half >= 0) {
                    sum += get(x, y - half)
                    count++
                }
                if (y + half < sz) {
                    sum += get(x, y + half)
                    count++
                }
                if (x - half >= 0) {
                    sum += get(x - half, y)
                    count++
                }
                if (x + half < sz) {
                    sum += get(x + half, y)
                    count++
                }
                set(x, y, sum / count + (rand() * 2 - 1) * scale)
            }
        }

        step = half
        scale *= roughness
    }

    return grid.map((v) => Math.max(0, Math.min(255, v)))
}

export class DiamondSquare extends Card {
    title = "Diamond Square"
    description =
        "Generates a procedural terrain depth map using the diamond-square algorithm."
    inputs: Port[] = [
        new ValuePort("size", false, dt.value(7)),
        new ValuePort("roughness", false, dt.value(0.5)),
        new ValuePort("seed", false, dt.value(0)),
    ]
    outputs: Port[] = [new DepthMapPort("depth map")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vals = inputs.filter(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )
        const sizeExp = Math.round(
            Math.max(1, Math.min(10, vals[0]?.value ?? 7)),
        )
        const roughness = Math.max(0, Math.min(1, vals[1]?.value ?? 0.5))
        const seed = vals[2]?.value ?? 0

        const rand = mulberry32(seed)
        const sz = (1 << sizeExp) + 1
        const values = diamondSquare(sizeExp, roughness, rand)

        return [dt.depthmap(values, sz, sz)]
    }

    init(): void {}
    cleanup(): void {}
}
