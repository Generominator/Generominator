import { env } from "@huggingface/transformers"
import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import {
    TextPort,
    ValuePort,
    WaveformPort,
    type Port,
} from "../cardBase/ports/port"
import { generateUUID } from "three/src/math/MathUtils.js"

// I don't know about you all but I'm not downloading any local models bleh
env.allowLocalModels = false

// Set cache mode based on environment (for tests n stuff)
env.useBrowserCache = typeof window !== "undefined"

// Voice models list (TTS will pick at random)
const voices = ["M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"]

/**
 * Implements the text to speech card.
 */
export class TextToSpeechCard extends Card {
    title = "Text-to-speech"
    description = "Convert text to human-like speech"

    inputs: Port[] = [
        new TextPort("source text", false),
        new ValuePort("speed", true, dt.value(1)),
        new ValuePort("pitch", true, dt.value(1)),
    ]
    outputs: Port[] = [new WaveformPort("speech")]

    private static worker: null | Worker = null

    private isRunning = false

    /**
     * Resamples audio buffer to change playback speed using linear interpolation for smooth results.
     * @param buffer - raw audio
     * @param ratio - (pitch * (1/speed))
     * @returns Converted number[] appropriate for dt.waveform()
     */
    private resampleLinear(buffer: Float32Array, ratio: number): Float32Array {
        const outputLength = Math.floor(buffer.length / ratio)
        const output = new Float32Array(outputLength)

        for (let i = 0; i < outputLength; i++) {
            const position = i * ratio
            const index = Math.floor(position)
            const fraction = position - index

            if (index + 1 < buffer.length) {
                const val =
                    buffer[index] +
                    (buffer[index + 1] - buffer[index]) * fraction
                output[i] = val
            } else {
                output[i] = buffer[index] || 0
            }
        }
        return output
    }

    generateTTS(
        text: string,
        speed: number,
        pitch: number,
    ): Promise<{ audio: Float32Array; sampling_rate: number }> {
        return new Promise((resolve, reject) => {
            this.initializeWorker()
            if (!TextToSpeechCard.worker) {
                throw new Error("Worker failed to initialize.")
            }
            const requestId = generateUUID()
            const handleMessage = (event: MessageEvent) => {
                const { type, data, error } = event.data
                if (event.data.id === requestId) {
                    TextToSpeechCard.worker?.removeEventListener(
                        "message",
                        handleMessage,
                    )
                    if (type === "result") {
                        resolve(data)
                    } else if (type === "error") {
                        reject(new Error(error))
                    }
                }
            }

            TextToSpeechCard.worker?.addEventListener("message", handleMessage)
            TextToSpeechCard.worker?.postMessage({
                type: "synthesize",
                task: "text-to-speech",
                model: "onnx-community/Supertonic-TTS-ONNX",
                input: text,
                options: {
                    speed,
                    pitch,
                    num_inference_steps: 3,
                    voice: voices[Math.floor(Math.random() * voices.length)],
                },
                id: requestId,
            })
        })
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const text = (inputs[0] as DataTypeOf<"text">)?.value ?? ""
        const speed = (inputs[1] as DataTypeOf<"value">)?.value ?? 1
        const pitch = (inputs[2] as DataTypeOf<"value">)?.value ?? 1

        if (!text || !speed || !pitch) {
            return [dt.waveform([])]
        }

        this.isRunning = true

        try {
            // Generate Raw Audio
            // The pipeline returns { audio: Float32Array, sampling_rate: number }
            const output = await this.generateTTS(text, speed, pitch)
            const rawSamples = output.audio as Float32Array
            const sampleRate = output.sampling_rate

            // Combining resampling (which changes pitch and speed) since you can't directly
            // affect either of these values

            let finalSamples: Float32Array

            // If we need to change the speed/pitch, do so now
            // Speed is default 1, > 1.0 = faster, < 1.0 = slower
            // Pitch is default 1, > 1.0 = higher, < 1.0 lower
            if (Math.abs(pitch - 1.0) > 0.001 && pitch > 0) {
                finalSamples = this.resampleLinear(rawSamples, pitch)
            } else {
                finalSamples = rawSamples
            }

            if (!this.isRunning) {
                throw new Error("TTS generation was cancelled.")
            }

            return [dt.waveform([...finalSamples], sampleRate)]
        } catch (err) {
            console.error("Text to Speech Error:", err)
            return [dt.waveform([])]
        }
    }

    initializeWorker() {
        if (!TextToSpeechCard.worker) {
            TextToSpeechCard.worker = new Worker(
                new URL(
                    "./workers/textToSpeechCard.worker.ts",
                    import.meta.url,
                ),
                { type: "module" },
            )
            TextToSpeechCard.worker.onmessage = (event) => {
                if (event.data.type === "ready") {
                    console.log(
                        `[TextToSpeechCard] loaded TTS model in worker.`,
                    )
                }
            }
        }
    }

    init(): void {
        this.initializeWorker()
        this.isRunning = true
    }
    cleanup(): void {
        // Don't cleanup worker in case it is used again
        this.isRunning = false
    }
}
