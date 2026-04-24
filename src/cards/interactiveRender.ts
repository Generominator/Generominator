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
    type Port,
} from "../cardBase/ports/port"
import * as THREE from "three"

const WIDTH = 800
const HEIGHT = 800
const VIEW_ANGLE = 70
const NEAR = 0.1
const FAR = 10000
const MOVE_SPEED = 0.1
const MOUSE_SENSITIVITY = 0.003

export class InteractiveRenderCard extends Card implements EventEmitting {
    title = "3D Interactive Render"
    description =
        "Renders a mesh with FPS-style mouse + keyboard camera control"
    inputs: Port[] = [
        new TriMeshPort("mesh", false),
        new VectorPort("initial position", false, dt.vector([10, 0, 5])),
        new VectorFieldPort(
            "lights",
            false,
            dt.vectorfield([dt.vector([1, 1, 8])]),
        ),
    ]
    outputs: Port[] = []

    private eventCallback: CardEventCallback | null = null
    private animFrameId: number | null = null

    // Camera state
    private yaw = 0
    private pitch = 0
    private pos = new THREE.Vector3(10, 0, 5)
    private posInitialized = false

    // Input state
    private keys = new Set<string>()
    private isDragging = false
    private lastMouseX = 0
    private lastMouseY = 0

    // Three.js objects
    private canvas: HTMLCanvasElement | null = null
    private renderer: THREE.WebGLRenderer | null = null
    private scene: THREE.Scene | null = null
    private camera: THREE.PerspectiveCamera | null = null
    private currentMesh: THREE.Object3D | null = null
    private currentLights: THREE.DirectionalLight[] = []

    // Bound event handlers (stored for removeEventListener)
    private onMouseDown: ((e: MouseEvent) => void) | null = null
    private onMouseMove: ((e: MouseEvent) => void) | null = null
    private onMouseUp: ((e: MouseEvent) => void) | null = null
    private onKeyDown: ((e: KeyboardEvent) => void) | null = null
    private onKeyUp: ((e: KeyboardEvent) => void) | null = null

    init(): void {
        this.canvas = document.createElement("canvas")
        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT
        this.canvas.tabIndex = 0
        this.canvas.style.cursor = "grab"
        document.getElementById("card-data")?.appendChild(this.canvas)

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

        // Bind event handlers
        this.onMouseDown = (e: MouseEvent) => {
            this.isDragging = true
            this.lastMouseX = e.clientX
            this.lastMouseY = e.clientY
            this.canvas!.style.cursor = "grabbing"
            this.canvas!.focus()
        }

        this.onMouseMove = (e: MouseEvent) => {
            if (!this.isDragging) return
            const dx = e.clientX - this.lastMouseX
            const dy = e.clientY - this.lastMouseY
            this.lastMouseX = e.clientX
            this.lastMouseY = e.clientY
            this.yaw -= dx * MOUSE_SENSITIVITY
            this.pitch -= dy * MOUSE_SENSITIVITY
            const pitchLimit = Math.PI / 2 - 0.01
            this.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, this.pitch))
        }

        this.onMouseUp = () => {
            this.isDragging = false
            if (this.canvas) this.canvas.style.cursor = "grab"
        }

        this.onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            if (["w", "a", "s", "d", " "].includes(key)) {
                e.preventDefault()
            }
            this.keys.add(key)
        }

        this.onKeyUp = (e: KeyboardEvent) => {
            this.keys.delete(e.key.toLowerCase())
        }

        this.canvas.addEventListener("mousedown", this.onMouseDown)
        this.canvas.addEventListener("keydown", this.onKeyDown)
        this.canvas.addEventListener("keyup", this.onKeyUp)
        document.addEventListener("mousemove", this.onMouseMove)
        document.addEventListener("mouseup", this.onMouseUp)

        const tick = () => {
            // Apply WASD movement (horizontal plane only)
            const forward = new THREE.Vector3(
                Math.cos(this.yaw),
                Math.sin(this.yaw),
                0,
            )
            const right = new THREE.Vector3(
                Math.sin(this.yaw),
                -Math.cos(this.yaw),
                0,
            )
            if (this.keys.has("w"))
                this.pos.addScaledVector(forward, MOVE_SPEED)
            if (this.keys.has("s"))
                this.pos.addScaledVector(forward, -MOVE_SPEED)
            if (this.keys.has("a")) this.pos.addScaledVector(right, -MOVE_SPEED)
            if (this.keys.has("d")) this.pos.addScaledVector(right, MOVE_SPEED)
            const up = new THREE.Vector3(0, 0, 1)
            if (this.keys.has(" ")) this.pos.addScaledVector(up, MOVE_SPEED)
            if (this.keys.has("shift"))
                this.pos.addScaledVector(up, -MOVE_SPEED)

            if (
                this.keys.has("w") ||
                this.keys.has("a") ||
                this.keys.has("s") ||
                this.keys.has("d") ||
                this.keys.has(" ") ||
                this.keys.has("shift") ||
                this.isDragging
            ) {
                this.eventCallback?.()
            }

            this.animFrameId = requestAnimationFrame(tick)
        }
        this.animFrameId = requestAnimationFrame(tick)
    }

    cleanup(): void {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId)
            this.animFrameId = null
        }

        if (this.canvas) {
            if (this.onMouseDown)
                this.canvas.removeEventListener("mousedown", this.onMouseDown)
            if (this.onKeyDown)
                this.canvas.removeEventListener("keydown", this.onKeyDown)
            if (this.onKeyUp)
                this.canvas.removeEventListener("keyup", this.onKeyUp)
            this.canvas.parentElement?.removeChild(this.canvas)
        }

        if (this.onMouseMove)
            document.removeEventListener("mousemove", this.onMouseMove)
        if (this.onMouseUp)
            document.removeEventListener("mouseup", this.onMouseUp)

        this.renderer?.dispose()
        this.renderer = null
        this.scene = null
        this.camera = null
        this.canvas = null
        this.currentMesh = null
        this.currentLights = []

        this.onMouseDown = null
        this.onMouseMove = null
        this.onMouseUp = null
        this.onKeyDown = null
        this.onKeyUp = null

        this.keys.clear()
        this.isDragging = false
        this.yaw = 0
        this.pitch = 0
        this.pos.set(10, 0, 5)
        this.posInitialized = false
    }

    setEventCallback(cb: CardEventCallback | null): void {
        this.eventCallback = cb
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (!this.renderer || !this.scene || !this.camera) {
            return []
        }

        if (!this.posInitialized) {
            const posInput = inputs.find(
                (input): input is DataTypeOf<"vector"> =>
                    input.kind === "vector",
            )
            if (posInput) {
                this.pos.set(
                    posInput.value.components[0] ?? 10,
                    posInput.value.components[1] ?? 0,
                    posInput.value.components[2] ?? 5,
                )
            }
            this.posInitialized = true
        }

        const meshInput = inputs.find(
            (input): input is DataTypeOf<"trimesh"> => input.kind === "trimesh",
        )
        if (!meshInput) {
            return []
        }

        // Update mesh if reference changed
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

        // Update camera from FPS state
        const forward = new THREE.Vector3(
            Math.cos(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
        )
        this.camera.position.copy(this.pos)
        this.camera.lookAt(this.pos.clone().add(forward))

        this.renderer.render(this.scene, this.camera)

        return []
    }
}

export default InteractiveRenderCard
