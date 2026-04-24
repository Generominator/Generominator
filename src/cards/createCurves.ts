import { Card } from "../cardBase/card.ts"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes.ts"
import {
    CurvePort,
    ValuePort,
    VectorFieldPort,
    type Port,
} from "../cardBase/ports/port"

export class CreateCurves extends Card {
    title = "Create Curves"
    description = "Bezier Curves from Vectors"
    inputs: Port[] = [
        new VectorFieldPort("control points", false, dt.vectorfield([])),
        new ValuePort("order", false, dt.value(3)),
    ]
    outputs: Port[] = [new CurvePort("curve")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const vectorField = inputs.find(
            (input): input is DataTypeOf<"vectorfield"> =>
                input?.kind === "vectorfield",
        )
        const orderInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input?.kind === "value",
        )

        if (!vectorField || vectorField.vectors.length === 0) {
            throw new Error("CreateCurves requires a vectorfield input")
        }

        const controlPoints = vectorField.vectors.map((v) => v.value.components)
        const order = orderInput?.value ?? 3
        const curve = new BezierCurve(controlPoints, order)
        return [dt.curve(curve)]
    }

    init(): void {}
    cleanup(): void {}
}

export class BezierCurve implements Curve {
    controlPoints: number[][]
    order: number

    constructor(controlPoints: number[][], order: number) {
        this.controlPoints = controlPoints
        this.order = order
    }

    getValue(t: number): number[] {
        // Each segment uses `order` control points, advancing by `order - 1` for the next
        // (consecutive segments share only their endpoints)
        const step = this.order - 1
        const segments = Math.floor((this.controlPoints.length - 1) / step)
        const index = Math.min(Math.floor(t * segments), segments - 1)
        const startIdx = index * step
        const localT = t * segments - index
        let controlPts: number[][] = []
        for (let i = 0; i < this.order; ++i) {
            controlPts.push(this.controlPoints[startIdx + i])
        }

        while (controlPts.length > 1) {
            const newControlPts: number[][] = []
            // linear interpolation between consecutive pairs of control points
            // result: new control polygon with 1 fewer point
            for (let i = 0; i < controlPts.length - 1; ++i) {
                newControlPts.push(
                    controlPts[i].map(
                        (_, k) =>
                            controlPts[i][k] * (1 - localT) +
                            controlPts[i + 1][k] * localT,
                    ),
                )
            }
            controlPts = newControlPts
        }

        return controlPts[0]
    }
}

export default CreateCurves
