import { Card } from "../cardBase/card"
import {
    dt,
    Vector,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes"
import {
    DepthMapPort,
    ValuePort,
    VectorPort,
    type Port,
} from "../cardBase/ports/port"
import Rand from "rand-seed"

export class Perlin2D extends Card {
    title: string = "Perlin 2D"
    description?: string | undefined
    inputs: Port[]
    outputs: Port[]

    constructor() {
        super()
        this.inputs = [
            new ValuePort("scale", false, dt.value(50)),
            new ValuePort("octaves", false, dt.value(4)),
            new ValuePort("persistance", false, dt.value(0.5)),
            new ValuePort("lacunarity", false, dt.value(2)),
            new VectorPort("offset", false, dt.vector([0, 0])),
            new VectorPort("size", false, dt.vector([256, 256])),
        ]
        this.outputs = [new DepthMapPort("noise")]
        Noise.seedPerlin(256, 7369425)
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 6 ||
            inputs[0].kind !== "value" ||
            inputs[1].kind !== "value" ||
            inputs[2].kind !== "value" ||
            inputs[3].kind !== "value" ||
            inputs[4].kind !== "vector" ||
            inputs[5].kind !== "vector"
        ) {
            throw new Error(
                `Perlin2D expects 4 values (scale, octaves, persistance, lacunarity) and two vector inputs (offset, size), got: ${JSON.stringify(inputs)}`,
            )
        }
        // Extract all inputs to their base data types
        // DataTypeOf<"value"> -> Number
        // DataTypeOf<"vector"> -> Vector object
        const scale = (inputs[0] as DataTypeOf<"value">).value
        const octaves = (inputs[1] as DataTypeOf<"value">).value
        const persistance = (inputs[2] as DataTypeOf<"value">).value
        const lacunarity = (inputs[3] as DataTypeOf<"value">).value
        const offsets = (inputs[4] as DataTypeOf<"vector">).value
        const size = (inputs[5] as DataTypeOf<"vector">).value

        // Generate noise from Bacon's old Perlin-in-TS code cause thats what I had on hand
        // Ran out of room for input nodes so seed is a hard coded value
        // (I made it 1 million Tau without the decimal for Markus)
        //
        // Noise.getNoiseMap returns a number[][] with values ranging from 0-1
        const noise_map = Noise.getNoiseMap(
            size.x(),
            size.y(),
            offsets,
            6283185,
            scale,
            octaves,
            persistance,
            lacunarity,
        )
        // Initialize the 1D array that will be passes into the output depthmap
        const depthmap_values: number[] = Array(size.x() * size.y())
        // Move and scale all the values from noise_map to depthmap_values;
        for (let j = 0; j < size.y(); j++) {
            for (let i = 0; i < size.x(); i++) {
                depthmap_values[j * size.x() + i] = noise_map[i][j] * 255
            }
        }
        const depthmap = dt.depthmap(depthmap_values, size.x(), size.y())

        return [depthmap]
    }
    init(): void {}
    cleanup(): void {}
}

// Old Perlin Code I had on my computer.
// Trust me. It works (:
class Noise {
    static getNoiseMap(
        width: number,
        height: number,
        offset: Vector,
        seed: number,
        scale: number,
        octaves: number,
        persistance: number,
        lacunarity: number,
    ): number[][] {
        const noise_map: number[][] = []
        for (let x = 0; x < width; x++) {
            noise_map.push([])
            for (let y = 0; y < height; y++) {
                noise_map[x].push(0)
            }
        }
        const halfWidth = width / 2
        const halfHeight = height / 2

        let frequency
        let amplitude = 1
        let maxPossibleHeight = 0

        const rand = new Rand(String(seed))
        const offsets: Vector[] = []
        for (let oct: number = 0; oct < octaves; oct++) {
            offsets.push(
                new Vector([
                    rand.next() * 20000 - 10000,
                    rand.next() * 20000 - 10000,
                ]).add(offset),
            )
            maxPossibleHeight += amplitude
            amplitude *= persistance
        }

        for (let y: number = 0; y < height; y++) {
            for (let x: number = 0; x < width; x++) {
                frequency = 1
                amplitude = 1
                let noiseValue: number = 0
                for (let oct: number = 0; oct < octaves; oct++) {
                    const sampleX =
                        ((x - halfWidth) / scale + offsets[oct].x()) * frequency
                    const sampleY =
                        ((y - halfHeight) / scale + offsets[oct].y()) *
                        frequency
                    const sampleValue: number = Noise.perlin2D(sampleX, sampleY)
                    noiseValue += sampleValue * amplitude

                    amplitude *= persistance
                    frequency *= lacunarity
                }
                /*
                Seems a little strange I dont need to divide the maxPossibleHeight by anything
                Thats why there's a random divide by 1 in here, just in case I need to increase it
                later
                */
                noise_map[x][y] =
                    (noiseValue + 1) / ((2 * maxPossibleHeight) / 1)
            }
        }

        return noise_map
    }

    static PERMUTATIONS: number[]
    static perlin2D(x: number, y: number): number {
        const POS = new Vector([x, y])
        const permuLength: number = Noise.PERMUTATIONS.length
        const CORNERS: Vector[] = [
            new Vector([Math.floor(x), Math.floor(y)]),
            new Vector([Math.floor(x) + 1, Math.floor(y)]),
            new Vector([Math.floor(x) + 1, Math.floor(y) + 1]),
            new Vector([Math.floor(x), Math.floor(y) + 1]),
        ]
        const aVecs: Vector[] = []
        CORNERS.forEach((corner) => {
            aVecs.push(POS.sub(corner))
        })
        const bVecs: Vector[] = []
        CORNERS.forEach((corner) => {
            const pX: number = Noise.mod(corner.x(), permuLength)
            const pY: number = Noise.mod(
                Noise.PERMUTATIONS[pX] + corner.y(),
                permuLength,
            )
            bVecs.push(Noise.getConstantVector(Noise.PERMUTATIONS[pY]))
        })
        const dots: number[] = []
        for (let i: number = 0; i < 4; i++) {
            dots.push(aVecs[i].dot(bVecs[i]))
        }
        const u: number = Noise.fade(x - Math.floor(x))
        const v: number = Noise.fade(y - Math.floor(y))

        return Noise.lerp(
            u,
            Noise.lerp(v, dots[0], dots[3]),
            Noise.lerp(v, dots[1], dots[2]),
        )
    }
    private static getConstantVector(v: number): Vector {
        if (v % 4 == 0) {
            return new Vector([1, 1])
        } else if (v % 4 == 1) {
            return new Vector([-1, 1])
        } else if (v % 4 == 2) {
            return new Vector([-1, -1])
        } else {
            return new Vector([1, -1])
        }
    }
    static seedPerlin(size: number, seed: number | string) {
        const rand = new Rand("" + seed)
        const inOrder: number[] = []
        for (let i: number = 0; i < size; i++) {
            inOrder.push(i)
        }
        this.PERMUTATIONS = []
        while (inOrder.length > 0) {
            const num: number = inOrder.splice(
                Math.floor(rand.next() * inOrder.length),
                1,
            )[0]
            Noise.PERMUTATIONS.push(num)
        }
    }
    static lerp(t: number, a: number, b: number): number {
        return a + t * (b - a)
    }

    static fade(t: number): number {
        return ((6 * t - 15) * t + 10) * t * t * t
    }

    static mod(n: number, m: number) {
        return ((n % m) + m) % m
    }
}
