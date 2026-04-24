import {
    Card,
    type EventEmitting,
    type CardEventCallback,
} from "../cardBase/card"
import {
    dt,
    type DataType,
    type DataTypeOf,
    PolygonCurve,
    type Curve,
} from "../cardBase/dataTypes"
import { ColorPort, ShapePort, type Port } from "../cardBase/ports/port"
import { BezierCurve } from "./createCurves"

function starPoints(
    n: number,
    outer: number,
    inner: number,
): [number, number][] {
    const pts: [number, number][] = []
    for (let i = 0; i < n * 2; i++) {
        const angle = (Math.PI / n) * i - Math.PI / 2
        const rr = i % 2 === 0 ? outer : inner
        pts.push([Math.cos(angle) * rr, Math.sin(angle) * rr])
    }
    return pts
}

export class BasicShapeCard extends Card implements EventEmitting {
    title = "Basic Shape"
    description = "Outputs a standard geometric shape."

    inputs: Port[] = [new ColorPort("color", false, dt.color(255, 0, 0, 1))]
    outputs: Port[] = [new ShapePort("shape")]

    private eventCallback: CardEventCallback | null = null

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    setSelected(selected: string): void {
        if (this.selected !== selected) {
            this.selected = selected
            this.eventCallback?.()
        }
    }

    options: Record<
        string,
        (color?: [number, number, number, number]) => Curve[]
    > = {
        Square: (color?) => [
            new PolygonCurve(
                [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [0.5, 0.5],
                    [-0.5, 0.5],
                ],
                color,
                true,
            ),
        ],
        Circle: (color?) => {
            const k = 0.5523,
                r = 0.5,
                kr = k * r
            const bez = new BezierCurve(
                [
                    [r, 0],
                    [r, kr],
                    [kr, r],
                    [0, r],
                    [-kr, r],
                    [-r, kr],
                    [-r, 0],
                    [-r, -kr],
                    [-kr, -r],
                    [0, -r],
                    [kr, -r],
                    [r, -kr],
                    [r, 0],
                ],
                4,
            )
            return [
                {
                    getValue: (t: number) => bez.getValue(t),
                    color,
                    closed: true,
                },
            ]
        },
        Triangle: (color?) => [
            new PolygonCurve(
                [
                    [0, 0.5],
                    [
                        Math.cos((210 * Math.PI) / 180) * 0.5,
                        Math.sin((210 * Math.PI) / 180) * 0.5,
                    ],
                    [
                        Math.cos((330 * Math.PI) / 180) * 0.5,
                        Math.sin((330 * Math.PI) / 180) * 0.5,
                    ],
                ],
                color,
                true,
            ),
        ],
        Star: (color?) => [
            new PolygonCurve(starPoints(5, 0.5, 0.2), color, true),
        ],
        Hexagon: (color?) => [
            new PolygonCurve(
                Array.from({ length: 6 }, (_, i) => {
                    const angle = (i * 60 * Math.PI) / 180
                    return [Math.cos(angle) * 0.5, Math.sin(angle) * 0.5] as [
                        number,
                        number,
                    ]
                }),
                color,
                true,
            ),
        ],
        Diamond: (color?) => [
            new PolygonCurve(
                [
                    [0, 0.5],
                    [0.5, 0],
                    [0, -0.5],
                    [-0.5, 0],
                ],
                color,
                true,
            ),
        ],
        Cross: (color?) => [
            new PolygonCurve(
                [
                    [0.2, 0.5],
                    [0.2, 0.2],
                    [0.5, 0.2],
                    [0.5, -0.2],
                    [0.2, -0.2],
                    [0.2, -0.5],
                    [-0.2, -0.5],
                    [-0.2, -0.2],
                    [-0.5, -0.2],
                    [-0.5, 0.2],
                    [-0.2, 0.2],
                    [-0.2, 0.5],
                ],
                color,
                true,
            ),
        ],
    }
    selected = "Square"

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const colorInput = inputs.find(
            (i): i is DataTypeOf<"color"> => i.kind === "color",
        )
        const color: [number, number, number, number] | undefined = colorInput
            ? [colorInput.r, colorInput.g, colorInput.b, colorInput.a]
            : undefined
        return [dt.shape(this.options[this.selected](color))]
    }

    init(): void {}
    cleanup(): void {}
}

export default BasicShapeCard
