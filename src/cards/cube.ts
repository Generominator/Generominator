import { Card } from "../cardBase/card.ts"
import { Port, TriMeshPort, ColorPort } from "../cardBase/ports/port.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"
import * as THREE from "three"

export class Cube extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string
    description: string

    number: number

    constructor() {
        super()
        this.title = "Cube"
        this.description = "A card that outputs a 1x1x1 cube mesh."
        this.number = 5
        this.inputs = [new ColorPort("color", false, dt.color(255, 0, 0, 1))]
        this.outputs = [new TriMeshPort("cube")]
    }

    cleanup(): void {
        // No cleanup necessary for this card
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        let color = 0xff0000
        if (inputs.length > 0) {
            if (inputs[0].kind !== "color") {
                throw new Error(
                    `Cube takes an optional color values, got: ${JSON.stringify(inputs)}`,
                )
            }
            color = inputs[0].r * 256 * 256 + inputs[0].g * 256 + inputs[0].b
        }

        // nominal orientation:
        // camera plane: x/y (0,0 is bottom left)
        // camera looking down the negative z direction

        const vertices = [
            // front plane (z = 0.5)
            new THREE.Vector3(-0.5, -0.5, 0.5),
            new THREE.Vector3(0.5, 0.5, 0.5),
            new THREE.Vector3(0.5, -0.5, 0.5),
            new THREE.Vector3(-0.5, 0.5, 0.5),
            // back plane (z = -0.5)
            new THREE.Vector3(-0.5, -0.5, -0.5),
            new THREE.Vector3(0.5, 0.5, -0.5),
            new THREE.Vector3(0.5, -0.5, -0.5),
            new THREE.Vector3(-0.5, 0.5, -0.5),
        ]

        const triangles = [
            // front plane (z = 0.5)
            vertices[1],
            vertices[0],
            vertices[2],
            vertices[0],
            vertices[1],
            vertices[3],

            // right plane (x = 0.5)
            vertices[2],
            vertices[6],
            vertices[1],
            vertices[1],
            vertices[6],
            vertices[5],

            // bottom plane (y = -0.5)
            vertices[2],
            vertices[0],
            vertices[4],
            vertices[2],
            vertices[4],
            vertices[6],

            // top plane (y = 0.5)
            vertices[1],
            vertices[5],
            vertices[3],
            vertices[3],
            vertices[5],
            vertices[7],

            // left plane (x = -0.5)
            vertices[4],
            vertices[3],
            vertices[7],
            vertices[0],
            vertices[3],
            vertices[4],

            // back plane (z = -0.5)
            vertices[5],
            vertices[6],
            vertices[4],
            vertices[5],
            vertices[4],
            vertices[7],
        ]

        const cube = new THREE.BufferGeometry()
        cube.setFromPoints(triangles)
        cube.computeVertexNormals()

        const material = new THREE.MeshLambertMaterial({ color: color })

        const meshobj = new THREE.Mesh(cube, material)

        return [dt.trimesh(meshobj)]
    }

    init(): void {
        // No initialization necessary for this card
    }
}
