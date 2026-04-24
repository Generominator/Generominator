import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import {
    TriMeshPort,
    VectorPort,
    ImagePort,
    DepthMapPort,
    VectorFieldPort,
    type Port,
} from "../cardBase/ports/port"
import * as THREE from "three"

function setupScene(width: number, height: number, canvas: HTMLCanvasElement) {
    const VIEW_ANGLE = 70
    const ASPECT = width / height
    const NEAR = 0.1
    const FAR = 10000

    const renderer = new THREE.WebGLRenderer({ canvas: canvas })
    const camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)
    camera.up.set(0, 0, 1)

    const scene = new THREE.Scene()
    scene.add(camera)
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    renderer.setSize(width, height)
    renderer.setClearColor(0xffffff, 1)

    const result = { scene: scene, renderer: renderer, camera: camera }
    return result
}

function addLights(scene: THREE.Scene, lights: DataTypeOf<"vectorfield">) {
    for (const light of lights.vectors) {
        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.x = light.value.components[0]
        dirLight.position.y = light.value.components[1]
        dirLight.position.z = light.value.components[2]
        scene.add(dirLight)
    }
}

function setupCamera(
    camera: THREE.Camera,
    position: DataTypeOf<"vector">,
    direction: DataTypeOf<"vector">,
) {
    camera.position.x = position.value.components[0]
    camera.position.y = position.value.components[1]
    camera.position.z = position.value.components[2]

    camera.lookAt(
        position.value.components[0] + direction.value.components[0],
        position.value.components[1] + direction.value.components[1],
        position.value.components[2] + direction.value.components[2],
    )
}

export class RenderTriMesh extends Card {
    title = "3D Render"
    description = "Render a given trimesh to an image"
    inputs: Port[] = [
        new TriMeshPort("mesh", false),
        new VectorPort("camera", false, dt.vector([0, 0, 10])),
        new VectorPort("viewing direction", false, dt.vector([0, 0, -1])),
        new VectorFieldPort(
            "lights",
            false,
            dt.vectorfield([dt.vector([1, 1, 8])]),
        ),
    ]
    outputs: Port[] = [
        new ImagePort("output image"),
        new DepthMapPort("depthmap"),
    ]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const canvas = document.createElement("canvas")
        const mesh = inputs.find(
            (input): input is DataTypeOf<"trimesh"> => input.kind === "trimesh",
        )

        if (!mesh) {
            throw new Error("Render requires a trimesh input")
        }

        const camera = inputs.filter(
            (input): input is DataTypeOf<"vector"> => input.kind === "vector",
        )

        let camera_position = dt.vector([0, 0, 10])
        let camera_direction = dt.vector([0, 0, -1])

        if (camera.length > 0) {
            camera_position = camera[0]
            if (camera.length > 1) camera_direction = camera[1]
        }

        console.log("camera position " + camera_position.value.components)
        console.log("camera direction " + camera_direction.value.components)

        let lights = inputs.find(
            (input): input is DataTypeOf<"vectorfield"> =>
                input.kind === "vectorfield",
        )
        if (!lights) {
            lights = dt.vectorfield([dt.vector([1, 1, 8])])
        }
        const WIDTH = 800
        const HEIGHT = 800
        canvas.width = WIDTH
        canvas.height = HEIGHT
        const sceneinfo = setupScene(WIDTH, HEIGHT, canvas)
        addLights(sceneinfo.scene, lights)
        setupCamera(sceneinfo.camera, camera_position, camera_direction)
        console.log(mesh.mesh)

        sceneinfo.scene.add(mesh.mesh)

        sceneinfo.renderer.render(sceneinfo.scene, sceneinfo.camera)

        const offscreenCanvas = document.createElement("canvas")
        offscreenCanvas.width = canvas.width
        offscreenCanvas.height = canvas.height

        const ctx = offscreenCanvas.getContext("2d")
        if (!ctx) {
            throw new Error("Failed to get 2D rendering context")
        }
        ctx.drawImage(canvas, 0, 0)

        // Render to a target with a depth texture
        const target = new THREE.WebGLRenderTarget(WIDTH, HEIGHT)
        target.texture.minFilter = THREE.NearestFilter
        target.texture.magFilter = THREE.NearestFilter
        target.texture.generateMipmaps = false
        target.stencilBuffer = false

        target.depthTexture = new THREE.DepthTexture(WIDTH, HEIGHT)
        target.depthTexture.format = THREE.DepthFormat
        target.depthTexture.type = THREE.FloatType

        sceneinfo.renderer.setRenderTarget(target)
        sceneinfo.renderer.render(sceneinfo.scene, sceneinfo.camera)

        // Read depth values via a shader pass that writes depth into the red channel
        const depthReadTarget = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
        })

        const depthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                depthTexture: { value: target.depthTexture },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D depthTexture;
                varying vec2 vUv;
                void main() {
                    float depth = texture2D(depthTexture, vUv).r;
                    gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
                }
            `,
        })

        const quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            depthMaterial,
        )
        const depthScene = new THREE.Scene()
        depthScene.add(quad)
        const depthCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        sceneinfo.renderer.setRenderTarget(depthReadTarget)
        sceneinfo.renderer.render(depthScene, depthCamera)
        sceneinfo.renderer.setRenderTarget(null)

        const pixelBuffer = new Float32Array(WIDTH * HEIGHT * 4)
        sceneinfo.renderer.readRenderTargetPixels(
            depthReadTarget,
            0,
            0,
            WIDTH,
            HEIGHT,
            pixelBuffer,
        )

        const depthValues: number[] = new Array(WIDTH * HEIGHT)
        for (let i = 0; i < WIDTH * HEIGHT; i++) {
            depthValues[i] = pixelBuffer[i * 4] // red channel
        }

        // Clean up WebGL resources
        target.dispose()
        depthReadTarget.dispose()
        depthMaterial.dispose()
        sceneinfo.renderer.dispose()

        return [
            dt.image(
                ctx.getImageData(
                    0,
                    0,
                    offscreenCanvas.width,
                    offscreenCanvas.height,
                ),
            ),
            dt.depthmap(depthValues, WIDTH, HEIGHT),
        ]
    }

    init(): void {}
    cleanup(): void {}
}

export default RenderTriMesh
