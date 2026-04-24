import { Card } from "../cardBase/card.ts"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes.ts"
import { CurvePort, VectorPort, type Port } from "../cardBase/ports/port"

export class MakeLine extends Card {
    title = "Make Line"
    description = "A straight line between two points"
    inputs: Port[] = [
        new VectorPort("from", false, dt.vector([0, 0, 0])),
        new VectorPort("to", false, dt.vector([0, 0, 1])),
    ]
    outputs: Port[] = [new CurvePort("curve")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const points = inputs.filter(
            (input): input is DataTypeOf<"vector"> => input?.kind === "vector",
        )

        if (!points || points.length < 2) {
            throw new Error("Make Line requires two points")
        }

        const curve = new Line(
            points[0].value.components,
            points[1].value.components,
        )
        return [dt.curve(curve)]
    }

    init(): void {}
    cleanup(): void {}
}

export class Line implements Curve {
    a: number[]
    b: number[]

    constructor(a: number[], b: number[]) {
        this.a = a
        this.b = b
    }

    getValue(t: number): number[] {
        return this.a.map((av, k) => av * (1 - t) + this.b[k] * t)
    }
}

export default MakeLine
