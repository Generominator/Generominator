import { Card } from "../cardBase/card"
import {
    dt,
    type Curve,
    type DataType,
    type DataTypeOf,
} from "../cardBase/dataTypes"
import { ValuePort, ShapePort, type Port } from "../cardBase/ports/port"

/**
 * Implements the Superformula Card.
 *
 * @see https://en.wikipedia.org/wiki/Superformula - formula source
 *
 * @remarks a = b in our case because those seemed like the least impactful
 * inputs.
 */
export class SuperformulaCard extends Card {
    title = "Superformula"
    description =
        "Creates an interesting shape from multiple values (non-patented version: superellipse)"

    inputs: Port[] = [
        new ValuePort("m", false, dt.value(0)),
        new ValuePort("n1", false, dt.value(1)),
        new ValuePort("n2", false, dt.value(1)),
        new ValuePort("n3", false, dt.value(1)),
        new ValuePort("a=b", false, dt.value(1)),
    ]
    outputs: Port[] = [new ShapePort("an interesting shape i suppose")]

    constructor() {
        super()
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const m = (inputs[0] as DataTypeOf<"value">)?.value ?? 0
        const n1 = (inputs[1] as DataTypeOf<"value">)?.value ?? 1
        const n2 = (inputs[2] as DataTypeOf<"value">)?.value ?? 1
        const n3 = (inputs[3] as DataTypeOf<"value">)?.value ?? 1
        const a = (inputs[4] as DataTypeOf<"value">)?.value ?? 1

        // We'll set a = b since we don't have another input to use
        const b = a

        // Create curve object
        const superCurve: Curve = {
            getValue: (t: number): number[] => {
                const phi = t * Math.PI * 2

                // r = ( |cos(m*phi/4)/a|^n2 + |sin(m*phi/4)/b|^n3 ) ^ -1/n1
                const term1 = Math.pow(
                    Math.abs(Math.cos((m * phi) / 4) / a),
                    n2,
                )
                const term2 = Math.pow(
                    Math.abs(Math.sin((m * phi) / 4) / b),
                    n3,
                )
                const r = Math.pow(term1 + term2, -1 / n1)

                // Cartesian coordinate conversion
                return [r * Math.cos(phi), r * Math.sin(phi)]
            },
        }

        return [dt.shape([superCurve])]
    }

    init(): void {}
    cleanup(): void {}
}
