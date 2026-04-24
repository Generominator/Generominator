import {
    Card,
    type CardEventCallback,
    type EventEmitting,
} from "../cardBase/card.ts"
import { ImagePort } from "../cardBase/ports/port.ts"
import { type DataType, dt } from "../cardBase/dataTypes.ts"

export class WebcamCard extends Card implements EventEmitting {
    title = "Webcam"
    description = "Camera that creates images"
    inputs = []
    outputs = [new ImagePort("image")]

    private video: HTMLVideoElement | null = null
    private canvas: HTMLCanvasElement | null = null
    private ctx: CanvasRenderingContext2D | null = null
    private eventCallback: CardEventCallback | null = null
    private animationFrameId: number | null = null
    private lastVideoTime = -1
    private error: string | null = null

    setEventCallback(callback: CardEventCallback | null): void {
        this.eventCallback = callback
    }

    async init() {
        this.error = null
        this.video = document.createElement("video")
        this.video.autoplay = true

        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")

        let stream: MediaStream
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true })
        } catch (err) {
            this.error =
                "[WebcamCard] getUserMedia failed: " + (err instanceof Error)
                    ? (err as Error).message
                    : String(err)
            console.error("[WebcamCard] getUserMedia failed:", err)
            return
        }

        // Register listener BEFORE srcObject/play so loadeddata cannot be missed
        const readyPromise = new Promise<void>((resolve) => {
            this.video?.addEventListener(
                "loadeddata",
                () => {
                    console.log(
                        `[WebcamCard] Video ready: ${this.video?.videoWidth}×${this.video?.videoHeight}`,
                    )
                    resolve()
                },
                { once: true },
            )
        })

        if (this.video) {
            this.video.srcObject = stream
            await this.video.play()
        }

        await readyPromise

        const loop = () => {
            if (this.video && this.video.currentTime !== this.lastVideoTime) {
                this.lastVideoTime = this.video.currentTime
                this.eventCallback?.()
            }
            this.animationFrameId = requestAnimationFrame(loop)
        }
        this.animationFrameId = requestAnimationFrame(loop)
    }

    async evaluate(): Promise<DataType[]> {
        if (this.error) {
            throw new Error(this.error)
        }
        if (
            !this.video ||
            !this.ctx ||
            !this.canvas ||
            this.video.readyState < 2
        ) {
            console.warn(
                "[WebcamCard] evaluate skipped:",
                !this.video
                    ? "no video"
                    : !this.ctx
                      ? "no canvas context"
                      : !this.canvas
                        ? "no canvas"
                        : `readyState=${this.video.readyState} (need ≥2)`,
            )
            return []
        }

        if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
            console.warn(
                "[WebcamCard] Video dimensions are 0×0, skipping frame",
            )
            return []
        }

        if (
            this.canvas.width !== this.video.videoWidth ||
            this.canvas.height !== this.video.videoHeight
        ) {
            this.canvas.width = this.video.videoWidth
            this.canvas.height = this.video.videoHeight
        }

        this.ctx.drawImage(this.video, 0, 0)
        const imageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
        )

        return [dt.image(imageData)]
    }

    cleanup() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
        if (this.video && this.video.srcObject) {
            const stream = this.video.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
        }
        this.video = null
        this.canvas = null
        this.ctx = null
        this.lastVideoTime = -1
    }
}
