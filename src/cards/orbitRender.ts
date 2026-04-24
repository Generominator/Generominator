import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import {
    TriMeshPort,
    VectorPort,
    VectorFieldPort,
    ImagePort,
    type Port,
} from "../cardBase/ports/port"
import * as THREE from "three"

const WIDTH = 800
const HEIGHT = 800
const VIEW_ANGLE = 70
const NEAR = 0.1
const FAR = 10000

export class OrbitRenderCard extends Card implements EventEmitting {
    title = "3D Orbit Render"
    description = "Renders a mesh with a continuously orbiting camera"
    inputs: Port[] = [
        new TriMeshPort("mesh", false),
        new VectorPort("camera offset", false, dt.vector([10, 0, 5])),
        new VectorPort("target", false, dt.vector([0, 0, 0])),
        new VectorFieldPort(
            "lights",
            false,
            dt.vectorfield([dt.vector([1, 1, 8])]),
        ),
    ]
    outputs: Port[] = [new ImagePort("output image")]

    private eventCallback: CardEventCallback | null = null
    private animFrameId: number | null = null
    private angle = 0
    private readonly angleStep = 0.02

    private canvas: HTMLCanvasElement | null = null
    private renderer: THREE.WebGLRenderer | null = null
    private scene: THREE.Scene | null = null
    private camera: THREE.PerspectiveCamera | null = null
    private currentMesh: THREE.Object3D | null = null
    private currentLights: THREE.DirectionalLight[] = []

    init(): void {
        this.canvas = document.createElement("canvas")
        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas })
        this.renderer.setSize(WIDTH, HEIGHT)
        this.renderer.setClearColor(0xffffff, 1)

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            WIDTH / HEIGHT,
            NEAR,
            FAR,
        )
        this.camera.up.set(0, 0, 1)
        this.scene.add(this.camera)
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3))

        const tick = () => {
            this.angle += this.angleStep
            this.eventCallback?.()
            this.animFrameId = requestAnimationFrame(tick)
        }
        this.animFrameId = requestAnimationFrame(tick)
    }

    cleanup(): void {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId)
            this.animFrameId = null
        }
        this.renderer?.dispose()
        this.renderer = null
        this.scene = null
        this.camera = null
        this.canvas = null
        this.currentMesh = null
        this.currentLights = []
        this.angle = 0
    }

    setEventCallback(cb: CardEventCallback | null): void {
        this.eventCallback = cb
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.renderer || !this.scene || !this.camera || !this.canvas) {
            return []
        }

        const meshInput = inputs.find(
            (input): input is DataTypeOf<"trimesh"> => input.kind === "trimesh",
        )
        if (!meshInput) {
            return []
        }

        // Update mesh if the reference has changed
        if (meshInput.mesh !== this.currentMesh) {
            if (this.currentMesh) {
                this.scene.remove(this.currentMesh)
            }
            this.currentMesh = meshInput.mesh
            this.scene.add(this.currentMesh)
        }

        // Replace all directional lights each evaluation
        for (const light of this.currentLights) {
            this.scene.remove(light)
        }
        this.currentLights = []

        let lights = inputs.find(
            (input): input is DataTypeOf<"vectorfield"> =>
                input.kind === "vectorfield",
        )
        if (!lights) {
            lights = dt.vectorfield([dt.vector([1, 1, 8])])
        }
        for (const lightVec of lights.vectors) {
            const dirLight = new THREE.DirectionalLight(0xffffff, 1)
            dirLight.position.x = lightVec.value.components[0]
            dirLight.position.y = lightVec.value.components[1]
            dirLight.position.z = lightVec.value.components[2]
            this.scene.add(dirLight)
            this.currentLights.push(dirLight)
        }

        // Extract vectors: first is camera offset, second is target
        const vectors = inputs.filter(
            (input): input is DataTypeOf<"vector"> => input.kind === "vector",
        )
        const offset = vectors[0] ?? dt.vector([10, 0, 5])
        const target = vectors[1] ?? dt.vector([0, 0, 0])

        const ox = offset.value.components[0] ?? 10
        const oy = offset.value.components[1] ?? 0
        const oz = offset.value.components[2] ?? 5
        const tx = target.value.components[0] ?? 0
        const ty = target.value.components[1] ?? 0
        const tz = target.value.components[2] ?? 0

        // Orbit math: rotate in the XY plane, keep Z height constant
        const r = Math.sqrt(ox * ox + oy * oy)
        const startAngle = Math.atan2(oy, ox)
        const totalAngle = startAngle + this.angle

        this.camera.position.set(
            tx + Math.cos(totalAngle) * r,
            ty + Math.sin(totalAngle) * r,
            tz + oz,
        )
        this.camera.lookAt(tx, ty, tz)

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.scene, this.camera)

        // Capture the rendered frame via an offscreen 2D canvas
        const offscreen = document.createElement("canvas")
        offscreen.width = WIDTH
        offscreen.height = HEIGHT
        const ctx = offscreen.getContext("2d")
        if (!ctx) {
            throw new Error("Failed to get 2D rendering context")
        }
        ctx.drawImage(this.canvas, 0, 0)

        return [dt.image(ctx.getImageData(0, 0, WIDTH, HEIGHT))]
    }
}

export default OrbitRenderCard
