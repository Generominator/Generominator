import { Card } from "../cardBase/card.ts"
import {
    type Port,
    DepthMapPort,
    ValuePort,
    ColorPort,
    TriMeshPort,
} from "../cardBase/ports/port.ts"
import { type DataType, type DataTypeOf, dt } from "../cardBase/dataTypes.ts"
import * as THREE from "three"

export class Heightmap extends Card {
    title = "Heightmap"
    description = "Converts a depth map into a 3D triangle mesh terrain."
    inputs: Port[] = [
        new DepthMapPort("depth map", false),
        new ValuePort("multiplier", false, dt.value(1)),
        new ValuePort("grid size", false, dt.value(1)),
        new ColorPort("color", false, dt.color(255, 0, 0, 1)),
    ]
    outputs: Port[] = [new TriMeshPort("heightmap")]

    // Keep one mesh/material instance so per-frame updates do not allocate forever.
    private mesh: THREE.Mesh | null = null
    private material: THREE.MeshLambertMaterial | null = null

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const depthmap = inputs.find(
            (input): input is DataTypeOf<"depthmap"> =>
                input.kind === "depthmap",
        )
        if (!depthmap) {
            throw new Error("Heightmap requires a depth map input")
        }

        const valueInputs = inputs.filter(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )
        const multiplier = valueInputs.length > 0 ? valueInputs[0].value : 1
        const gridSize = valueInputs.length > 1 ? valueInputs[1].value : 1

        const colorInput = inputs.find(
            (input): input is DataTypeOf<"color"> => input.kind === "color",
        )
        const color = colorInput
            ? colorInput.r * 65536 + colorInput.g * 256 + colorInput.b
            : 0xff0000

        // Reuse one material and only update its color.
        if (!this.material) {
            this.material = new THREE.MeshLambertMaterial({ color })
        }

        this.material.color.setHex(color)
        // Reuse one mesh and swap its geometry instead of making a new one
        if (!this.mesh) {
            this.mesh = new THREE.Mesh(
                new THREE.BufferGeometry(),
                this.material,
            )
        }

        const { values, width: W, height: H } = depthmap

        const triangleVertices: THREE.Vector3[] = []
        for (let r = 0; r < H - 1; r++) {
            for (let c = 0; c < W - 1; c++) {
                const v00 = new THREE.Vector3(
                    c * gridSize,
                    r * gridSize,
                    values[r * W + c] * multiplier,
                )
                const v10 = new THREE.Vector3(
                    c * gridSize,
                    (r + 1) * gridSize,
                    values[(r + 1) * W + c] * multiplier,
                )
                const v01 = new THREE.Vector3(
                    (c + 1) * gridSize,
                    r * gridSize,
                    values[r * W + (c + 1)] * multiplier,
                )
                const v11 = new THREE.Vector3(
                    (c + 1) * gridSize,
                    (r + 1) * gridSize,
                    values[(r + 1) * W + (c + 1)] * multiplier,
                )

                // Triangle 1: CCW from +Z: v00 → v01 → v10
                triangleVertices.push(v00, v01, v10)
                // Triangle 2: CCW from +Z: v01 → v11 → v10
                triangleVertices.push(v01, v11, v10)
            }
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setFromPoints(triangleVertices)
        geometry.translate(
            (-(W - 1) * gridSize) / 2,
            (-(H - 1) * gridSize) / 2,
            0,
        )
        geometry.computeVertexNormals()

        // Dispose the previous geometry so we don't balloon memory over time
        const oldGeometry = this.mesh.geometry as THREE.BufferGeometry
        this.mesh.geometry = geometry
        oldGeometry.dispose()

        return [dt.trimesh(this.mesh)]
    }

    init(): void {}

    cleanup(): void {
        this.mesh?.geometry.dispose()
        this.material?.dispose()
        this.mesh = null
        this.material = null
    }
}
