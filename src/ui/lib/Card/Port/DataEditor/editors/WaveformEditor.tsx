import React from "react"
import "../dataEditor.css"
import type { DataTypeOf } from "../../../../../../cardBase/dataTypes"

function WaveformEditor({
    value,
    onChange = () => {},
}: {
    value: DataTypeOf<"waveform"> | null
    onChange: (newValue: DataTypeOf<"waveform">) => void
}) {
    const ref = React.useRef<HTMLInputElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [loading, setLoading] = React.useState(false)

    function onInputEnd() {
        const file = ref.current?.files?.[0]
        if (!file) return
        setLoading(true)
        const reader = new FileReader()
        reader.onload = async function (e) {
            let audioContext: AudioContext | null = null
            try {
                if (!e.target?.result) {
                    console.error("Failed to read file")
                    return
                }

                const arrayBuffer: ArrayBuffer = e.target.result as ArrayBuffer
                audioContext = new AudioContext()
                const audioBuffer =
                    await audioContext.decodeAudioData(arrayBuffer)

                // Keep a full copy for playback.
                const rawData = audioBuffer.getChannelData(0)
                onChange({
                    kind: "waveform",
                    samples: Array.from(rawData),
                    sampleRate: audioBuffer.sampleRate,
                })
            } catch (err) {
                console.error("Error decoding audio data", err)
            } finally {
                if (audioContext) {
                    void audioContext.close()
                }
                setLoading(false)
            }
        }
        reader.onerror = function (e) {
            console.error("Error reading file", e)
            setLoading(false)
        }
        reader.readAsArrayBuffer(file)
    }

    function renderSamples() {
        if (!canvasRef.current || value === null) return
        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        const width = canvasRef.current.width
        const height = canvasRef.current.height

        // Crush it down for preview like the other one
        const step = Math.max(1, Math.floor(value.samples.length / width))
        for (let i = 0; i < width; i++) {
            const start = i * step
            const end = Math.min(value.samples.length, start + step)
            let peak = 0
            for (let j = start; j < end; j++) {
                peak = Math.max(peak, Math.abs(value.samples[j]))
            }
            const barHeight = (peak * height) / 2
            ctx.fillStyle = "black"
            ctx.fillRect(i, height / 2 - barHeight, 1, barHeight * 2)
        }
    }

    React.useEffect(renderSamples, [value])

    return (
        <>
            <button
                className="const-color-btn"
                onClick={() => ref.current?.click()}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display:
                            !loading && value && value.samples.length > 0
                                ? "block"
                                : "none",
                    }}
                    width={200}
                    height={50}
                />
                {loading && "Loading..."}
                {!loading &&
                    (!value || value.samples.length === 0) &&
                    "Upload Audio"}
            </button>
            <input
                ref={ref}
                style={{ display: "none" }}
                type="file"
                accept="audio/*"
                onChange={onInputEnd}
            />
        </>
    )
}

export default WaveformEditor
