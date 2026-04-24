import { Card } from "../cardBase/card"
import { type DataType, dt } from "../cardBase/dataTypes"
import { StatePort, WaveformPort } from "../cardBase/ports/port"

export class SpeakerCard extends Card {
    title = "speaker"
    description = "Amplify a sound"

    inputs = [
        new WaveformPort("waveform", false),
        new StatePort("loop", true, dt.state(false)),
    ]
    outputs = []
    private audioContext: AudioContext | null = null
    private sourceNode: AudioBufferSourceNode | null = null

    init(): void {
        this.ensureAudioContext()
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const inputData = inputs[0]
        let loopState = inputs[1]

        if (inputData?.kind !== "waveform" || inputData.samples.length === 0) {
            this.stopLoop()
            return []
        }

        if (loopState?.kind !== "state") {
            loopState = dt.state(false)
        }
        const audioContext = this.ensureAudioContext()
        if (!audioContext) {
            return []
        }

        try {
            await audioContext.resume()
        } catch {
            return []
        }

        // AudioBuffer cannot be created outside this range
        const clampedSampleRate = Math.max(
            3000,
            Math.min(inputData.sampleRate, 768000),
        )
        const ratio = inputData.sampleRate / clampedSampleRate
        const buffer = audioContext.createBuffer(
            1,
            Math.floor(inputData.samples.length / ratio),
            clampedSampleRate,
        )
        const channelData = buffer.getChannelData(0)
        if (buffer.length !== inputData.samples.length) {
            // If the AudioBuffer length was clamped, we need to resample the data to fit
            const ratio = inputData.samples.length / buffer.length
            for (let i = 0; i < buffer.length; i++) {
                const position = i * ratio
                if (1 - (position % 1) < 0.5) {
                    channelData[i] = inputData.samples[Math.ceil(position)] ?? 0
                } else {
                    channelData[i] =
                        inputData.samples[Math.floor(position)] ?? 0
                }
            }
        } else {
            for (let i = 0; i < inputData.samples.length; i++) {
                channelData[i] = Math.max(-1, Math.min(1, inputData.samples[i]))
            }
        }

        this.stopLoop()

        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.loop = loopState.value
        source.connect(audioContext.destination)
        source.start()
        this.sourceNode = source

        return []
    }

    cleanup(): void {
        this.stopLoop()
        if (this.audioContext) {
            void this.audioContext.close()
            this.audioContext = null
        }
        console.log("speaker card cleaned up")
    }

    // Why is it so annoying to get audio working on a browser??
    private ensureAudioContext(): AudioContext | null {
        const windowWithWebkit = globalThis as typeof globalThis & {
            webkitAudioContext?: typeof AudioContext
        }
        const AudioContextCtor =
            globalThis.AudioContext ?? windowWithWebkit.webkitAudioContext
        if (!AudioContextCtor) {
            return null
        }
        this.audioContext ??= new AudioContextCtor()
        return this.audioContext
    }

    private stopLoop(): void {
        if (!this.sourceNode) return

        try {
            this.sourceNode.stop()
        } catch {
            // Dont care
        }
        this.sourceNode.disconnect()
        this.sourceNode = null
    }
}
