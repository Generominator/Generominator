import { Card } from "../cardBase/card"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes"
import {
    ImagePort,
    ValuePort,
    ColorPort,
    type Port,
} from "../cardBase/ports/port"

class Flower implements Curve {
    petals: number
    size: number
    scale: number
    constructor(petals: number, size: number, scale: number) {
        this.petals = petals
        this.size = size
        this.scale = scale
    }

    getValue(t: number): number[] {
        // flower petals: sin wave wrapped around a circle
        // see: http://sambrunacini.com/parametric-flowers/

        // first: where are we on the circle: map t (0-1) to radians (0-tau)
        const circle_t = t * 2 * Math.PI

        // second: calculate wave; more petals = more revolutions
        //         size offsets wavy circle from center
        const wave = this.size + Math.sin(this.petals * circle_t)

        // third: combine wave with circle
        return [
            this.scale * wave * Math.cos(circle_t),
            this.scale * wave * Math.sin(circle_t),
        ]
    }
}

export class ParametricFlower2D extends Card {
    title = "Parametric Flower 2D"
    description = "Creates a 2D image of a parametric flower"
    inputs: Port[] = [
        new ValuePort("petal count", false, dt.value(5)),
        new ValuePort("petal size", false, dt.value(1)),
        new ValuePort("petal width", false, dt.value(0.5)),
        new ColorPort("inner color", false, dt.color(238, 238, 206, 1)), // Aths Special #EEEECE
        new ColorPort("outer color", false, dt.color(224, 82, 99, 1)), // Mandy #E05263
    ]
    outputs: Port[] = [new ImagePort("output image")]
    canvas = document.createElement("canvas")
    ctx = this.canvas.getContext("2d")
    offset: [number, number] = [0, 0]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.ctx) {
            throw new Error(
                "ParametricFlower2D error: 2D context not available",
            )
        }
        const petals = inputs.filter(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )
        let colors = inputs.filter(
            (input): input is DataTypeOf<"color"> => input.kind === "color",
        )

        if (!petals || petals.length < 3) {
            throw new Error(
                "ParametricFlower2D requires at least 3 numeric inputs: petal count, petal size and petal width",
            )
        }

        if (!colors || colors.length == 0) {
            colors = [
                {
                    r: 238,
                    g: 238,
                    b: 206,
                    a: 1,
                    kind: "color",
                }, // Aths Special #EEEECE
                {
                    r: 224,
                    g: 82,
                    b: 99,
                    a: 1,
                    kind: "color",
                },
            ] // Mandy #E05263
        }

        if (colors.length < 2) {
            colors.push({
                r: 224,
                g: 82,
                b: 99,
                a: 1,
                kind: "color",
            }) // Mandy #E05263
        }

        const petal_count = petals[0].value
        const petal_size = petals[1].value
        const petal_width = petals[2].value

        const inner_color = colors[0]
        const outer_color = colors[1]

        const BASE_SIZE = 2
        const SCALE = 20

        const outer = new Flower(petal_count, BASE_SIZE + petal_size, SCALE)
        const inner = new Flower(
            petal_count,
            BASE_SIZE + petal_size - petal_width,
            SCALE,
        )

        const step = 0.01

        // get bounding box of the curve
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        for (let t = 0; t <= 1; t += step) {
            const [x, y] = outer.getValue(t)
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

        // we draw the outer (bigger) flower first, and then the inner (smaller) one on top
        for (const flower of [
            { curve: outer, color: outer_color },
            { curve: inner, color: inner_color },
        ]) {
            this.ctx.strokeStyle = "white"
            const region = new Path2D()

            const [x0, y0] = flower.curve.getValue(0)
            region.moveTo(x0 - minX, this.canvas.height - (y0 - minY))

            for (let t = step; t <= 1; t += step) {
                const [x, y] = flower.curve.getValue(t)
                region.lineTo(x - minX, this.canvas.height - (y - minY))
            }
            region.closePath()
            this.ctx.fillStyle = `rgb(${flower.color.r},${flower.color.g},${flower.color.b})`
            this.ctx.fill(region, "evenodd")
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

export default ParametricFlower2D
