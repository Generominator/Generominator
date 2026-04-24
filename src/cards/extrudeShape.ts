import { Card } from "../cardBase/card.ts"
import { type DataType, type DataTypeOf, dt } from "../cardBase/dataTypes.ts"
import {
    ColorPort,
    CurvePort,
    ShapePort,
    TriMeshPort,
    ValuePort,
    type Port,
} from "../cardBase/ports/port.ts"
import * as THREE from "three"

export class ExtrudeShape extends Card {
    title = "Extrude Shape"
    description =
        "Sweeps a 2D profile along a 3D spine curve to produce a triangle mesh."
    inputs: Port[] = [
        new ShapePort("profile", false),
        new CurvePort("path", false),
        new ValuePort("rotation", false, dt.value(0)),
        new ValuePort("path samples", false, dt.value(10)),
        new ValuePort("profile samples", false, dt.value(10)),
        new ColorPort("color", true, dt.color(255, 0, 0, 1)),
    ]
    outputs: Port[] = [new TriMeshPort("mesh")]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const shapeInput = inputs.find(
            (i): i is DataTypeOf<"shape"> => i.kind === "shape",
        )
        const curveInput = inputs.find(
            (i): i is DataTypeOf<"curve"> => i.kind === "curve",
        )
        const colorInput = inputs.find(
            (i): i is DataTypeOf<"color"> => i != null && i.kind === "color",
        )

        const valueInputs = inputs.filter(
            (i): i is DataTypeOf<"value"> => i.kind === "value",
        )

        const rotationDeg = valueInputs[0]?.value ?? 0
        const pathSamplesRaw = valueInputs[1]?.value ?? 10
        const profileSamplesRaw = valueInputs[2]?.value ?? 10

        const pathSamples = Math.max(2, Math.round(pathSamplesRaw))
        const profileSamples = Math.max(2, Math.round(profileSamplesRaw))
        const totalRotationRadians = (rotationDeg * Math.PI) / 180

        const color = colorInput
            ? new THREE.Color(colorInput.r, colorInput.g, colorInput.b)
            : null

        const geometry = new THREE.BufferGeometry()

        const shapeIsEmpty = !shapeInput || shapeInput.value.length === 0
        if (shapeIsEmpty || !curveInput) {
            const material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(0xff0000),
                side: THREE.DoubleSide,
            })
            return [dt.trimesh(new THREE.Mesh(geometry, material))]
        }

        const spine = curveInput.value

        // Step 1: Sample the spine
        const spinePoints: THREE.Vector3[] = []
        for (let i = 0; i <= pathSamples; i++) {
            const t = i / pathSamples
            const p = spine.getValue(t)
            spinePoints.push(new THREE.Vector3(p[0] ?? 0, p[1] ?? 0, p[2] ?? 0))
        }

        const n = pathSamples

        // Step 2: Compute tangents with central differences
        const tangents: THREE.Vector3[] = new Array(n + 1)
        tangents[0] = spinePoints[1].clone().sub(spinePoints[0])
        tangents[n] = spinePoints[n].clone().sub(spinePoints[n - 1])
        for (let i = 1; i < n; i++) {
            tangents[i] = spinePoints[i + 1].clone().sub(spinePoints[i - 1])
        }

        // Normalize tangents, falling back to previous if zero-length
        for (let i = 0; i <= n; i++) {
            const len = tangents[i].length()
            if (len < 1e-10) {
                if (i > 0) tangents[i] = tangents[i - 1].clone()
            } else {
                tangents[i].divideScalar(len)
            }
        }

        // Step 3: Build parallel-transported frame
        const right: THREE.Vector3[] = new Array(n + 1)
        const up: THREE.Vector3[] = new Array(n + 1)

        const zAxis = new THREE.Vector3(0, 0, 1)
        const xAxis = new THREE.Vector3(1, 0, 0)

        let r0 = new THREE.Vector3().crossVectors(tangents[0], zAxis)
        if (r0.length() < 1e-6) {
            r0 = new THREE.Vector3().crossVectors(tangents[0], xAxis)
        }
        right[0] = r0.normalize()
        up[0] = new THREE.Vector3()
            .crossVectors(tangents[0], right[0])
            .normalize()

        for (let i = 0; i < n; i++) {
            const q = new THREE.Quaternion().setFromUnitVectors(
                tangents[i],
                tangents[i + 1],
            )
            right[i + 1] = right[i].clone().applyQuaternion(q).normalize()
            up[i + 1] = new THREE.Vector3()
                .crossVectors(tangents[i + 1], right[i + 1])
                .normalize()
        }

        // Step 4: Apply progressive twist
        const finalRight: THREE.Vector3[] = new Array(n + 1)
        const finalUp: THREE.Vector3[] = new Array(n + 1)

        for (let i = 0; i <= n; i++) {
            const alpha = (i / pathSamples) * totalRotationRadians
            const twistQ = new THREE.Quaternion().setFromAxisAngle(
                tangents[i],
                alpha,
            )
            finalRight[i] = right[i].clone().applyQuaternion(twistQ)
            finalUp[i] = up[i].clone().applyQuaternion(twistQ)
        }

        // Step 5 & 6: Sample profile, transform to 3D, and triangulate
        const triangleVertices: THREE.Vector3[] = []
        const materials: THREE.MeshLambertMaterial[] = []
        const groups: { start: number; count: number; matIndex: number }[] = []

        for (const profileCurve of shapeInput.value) {
            const groupStart = triangleVertices.length

            const outline = profileCurve.getOutline?.()
            const numSegs = outline ? outline.length : profileSamples

            const pts: THREE.Vector3[][] = []
            for (let i = 0; i <= n; i++) {
                const row: THREE.Vector3[] = []
                for (let j = 0; j <= numSegs; j++) {
                    const p2d = outline
                        ? outline[j % outline.length]
                        : profileCurve.getValue(j / profileSamples)
                    const px = p2d[0] ?? 0
                    const py = p2d[1] ?? 0
                    const pt = spinePoints[i]
                        .clone()
                        .addScaledVector(finalRight[i], px)
                        .addScaledVector(finalUp[i], py)
                    row.push(pt)
                }
                pts.push(row)
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < numSegs; j++) {
                    const v00 = pts[i][j],
                        v01 = pts[i][j + 1]
                    const v10 = pts[i + 1][j],
                        v11 = pts[i + 1][j + 1]
                    triangleVertices.push(v00, v01, v10)
                    triangleVertices.push(v01, v11, v10)
                }
            }

            // Per-curve color: prefer curve's own color, fall back to port color or default
            let curveColor: THREE.Color
            if (profileCurve.color) {
                const [r, g, b] = profileCurve.color
                curveColor = new THREE.Color(r * 256 * 256 + g * 256 + b)
            } else {
                curveColor = color ?? new THREE.Color(0xff0000)
            }

            materials.push(
                new THREE.MeshLambertMaterial({
                    color: curveColor,
                    side: THREE.DoubleSide,
                }),
            )
            groups.push({
                start: groupStart,
                count: triangleVertices.length - groupStart,
                matIndex: materials.length - 1,
            })
        }

        // Step 7: Build THREE.js mesh
        geometry.setFromPoints(triangleVertices)
        geometry.computeVertexNormals()

        for (const { start, count, matIndex } of groups) {
            geometry.addGroup(start, count, matIndex)
        }

        return [dt.trimesh(new THREE.Mesh(geometry, materials))]
    }

    init(): void {}
    cleanup(): void {}
}

export default ExtrudeShape
