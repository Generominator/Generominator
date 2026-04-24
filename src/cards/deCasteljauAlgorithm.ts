import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { CurvePort, Port, ValuePort, VectorPort } from "../cardBase/ports/port"
import { BezierCurve } from "./createCurves"

/**
 * Implements the DeCasteljau's algorithm card. "t", or sample pos, should be between [0,1].
 *
 * Restrictions: needs a Bezier Curve.
 *
 * @see https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
 * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve
 * @see https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-der.html
 * @see https://scispace.com/pdf/computer-aided-geometric-design-swp2flow39.pdf - Section 2.6
 *
 */
export class DeCasteljauAlgorithmCard extends Card {
    title = "DeCasteljau's algorithm"
    description = "Calculate points or tangents along a Bezier curve"

    inputs: Port[] = [
        new CurvePort("curve", false),
        new ValuePort("sample rate", false, dt.value(0)),
        new ValuePort("sample pos", false, dt.value(0)),
    ]
    outputs: Port[] = [
        new VectorPort("points"),
        new VectorPort("tangents"),
        new VectorPort("accelerations"),
    ]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const curveInput = inputs[0] as DataTypeOf<"curve">
        const sampleRate = (inputs[1] as DataTypeOf<"value">)?.value ?? 0
        const samplePos = (inputs[2] as DataTypeOf<"value">)?.value ?? 0

        const curveValue = curveInput.value

        // It's not really deCasteljau's algorithm if you don't have the control points.
        if (
            !curveInput ||
            curveInput.kind !== "curve" ||
            !(curveValue instanceof BezierCurve)
        ) {
            console.warn(
                "DeCasteljauAlgorithmCard: Input must be a BezierCurve",
            )
            return [dt.vector([]), dt.vector([]), dt.vector([])]
        }

        const tValues: number[] = []
        if (sampleRate > 1) {
            // We sample some amount of points along [0, 1]
            for (let i = 0; i < sampleRate; i++) {
                tValues.push(i / (sampleRate - 1))
            }
        } else {
            // Otherwise we just grab one point
            tValues.push(samplePos)
        }

        const allPoints: number[] = []
        const allTangents: number[] = []
        const allAccels: number[] = []

        // Determine number of segments
        const n = curveValue.order - 1
        if (n <= 0 || curveValue.controlPoints.length < curveValue.order) {
            console.warn(
                "DeCasteljauAlgorithmCard: Mathematically not possible input curve",
            )
            return [dt.vector([]), dt.vector([]), dt.vector([])]
        }
        const totalSegments = Math.floor(
            (curveValue.controlPoints.length - 1) / n,
        )

        for (const rawT of tValues) {
            // Ensure t is always in [0,1] because floating points
            const t = Math.max(0, Math.min(1, rawT))

            // Map Global t (0..1 over whole curve) to Local u (0..1 over single segment)
            const segmentIndex = Math.min(
                Math.floor(t * totalSegments),
                totalSegments - 1,
            )
            const localT = t * totalSegments - segmentIndex
            const startIdx = segmentIndex * n

            // Set up recursion with the control points for this specific segment
            let currentLevel: number[][] = []
            for (let i = 0; i < curveValue.order; ++i) {
                currentLevel.push(curveValue.controlPoints[startIdx + i])
            }

            // Repeat linear interpolation
            // Formula: P_i^r = (1 - t) * P_i^{r-1} + t * P_{i+1}^{r-1}
            const levels: number[][][] = [currentLevel]

            while (currentLevel.length > 1) {
                const nextLevel: number[][] = []
                for (let i = 0; i < currentLevel.length - 1; i++) {
                    const p0 = currentLevel[i]
                    const p1 = currentLevel[i + 1]
                    nextLevel.push([
                        p0[0] * (1 - localT) + p1[0] * localT,
                        p0[1] * (1 - localT) + p1[1] * localT,
                    ])
                }
                currentLevel = nextLevel
                levels.push(currentLevel)
            }

            // Point is the single value in the final level of repetition
            const point = levels[levels.length - 1][0]
            allPoints.push(point[0], point[1])

            // Extract tangent (1st derivative)
            // B'(u) = n * (P_1^{n-1} - P_0^{n-1})
            if (levels.length >= 2) {
                const secondToLast = levels[levels.length - 2]
                const q0 = secondToLast[0]
                const q1 = secondToLast[1]

                // Chain Rule: Differentiate with respect to global 't', not local 'u'.
                // dt/du = totalSegments -> B'(t) = B'(u) * totalSegments
                const scale = n * totalSegments

                allTangents.push(
                    (q1[0] - q0[0]) * scale,
                    (q1[1] - q0[1]) * scale,
                )
            } else {
                allTangents.push(0, 0)
            }

            // Extract accelerations (2nd derivative)
            // Formula: B''(u) = n * (n-1) * (P_2^{n-2} - 2P_1^{n-2} + P_0^{n-2})
            if (levels.length >= 3) {
                const thirdToLast = levels[levels.length - 3]
                const r0 = thirdToLast[0]
                const r1 = thirdToLast[1]
                const r2 = thirdToLast[2]

                // Chain Rule: B''(t) = B''(u) * (totalSegments)^2
                const scale = n * (n - 1) * (totalSegments * totalSegments)

                allAccels.push(
                    (r2[0] - 2 * r1[0] + r0[0]) * scale,
                    (r2[1] - 2 * r1[1] + r0[1]) * scale,
                )
            } else {
                allAccels.push(0, 0)
            }
        }

        return [
            dt.vector(allPoints),
            dt.vector(allTangents),
            dt.vector(allAccels),
        ]
    }

    init(): void {}
    cleanup(): void {}
}
