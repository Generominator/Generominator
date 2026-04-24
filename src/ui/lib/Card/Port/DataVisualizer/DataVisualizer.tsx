import React from "react"
import "./DataVisualizer.css"
import { Graph, Vector, type DataType } from "../../../../../cardBase/dataTypes"

function ImageVisualizer({
    values,
    index,
}: {
    values: DataType[]
    index: number
}) {
    const ref = React.useRef<HTMLCanvasElement>(null)

    let data: ImageData
    const rawData = values[index] as DataType & { kind: "image" | "depthmap" }

    if (rawData.kind === "image") {
        data = rawData.data
    } else {
        // Turn depthmap into grayscale image data for visualization
        data = new ImageData(rawData.width, rawData.height)
        for (let i = 0; i < rawData.values.length; i++) {
            const depthValue = rawData.values[i]
            const gray = Math.min(255, Math.max(0, Math.min(depthValue, 255)))
            data.data[i * 4 + 0] = gray // R
            data.data[i * 4 + 1] = gray // G
            data.data[i * 4 + 2] = gray // B
            data.data[i * 4 + 3] = 255 // A
        }
    }

    React.useEffect(() => {
        if (!ref.current) return
        const ctx = ref.current.getContext("2d")
        if (!ctx) return
        ref.current.width = data.width
        ref.current.height = data.height
        ctx.clearRect(0, 0, ref.current.width, ref.current.height)
        ctx.putImageData(data, 0, 0)
    }, [data, ref.current])

    return <canvas className="image-visualizer" ref={ref}></canvas>
}

function WaveformVisualizer({
    values,
    index,
}: {
    values: DataType[]
    index: number
}) {
    const data = values[index] as DataType & { kind: "waveform" }
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const sourceRef = React.useRef<AudioBufferSourceNode | null>(null)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const playbackHeadRef = React.useRef<number>(0)
    const [playbackPosition, setPlaybackPosition] = React.useState<
        number | null
    >(null)

    function stopWaveform() {
        if (sourceRef.current) {
            try {
                sourceRef.current.stop()
            } catch {
                // no-op: source may already be stopped
            }
            sourceRef.current.disconnect()
            sourceRef.current = null
        }
        if (audioContextRef.current) {
            void audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (playbackHeadRef.current) {
            cancelAnimationFrame(playbackHeadRef.current)
            playbackHeadRef.current = 0
        }
        setPlaybackPosition(null)
    }

    React.useEffect(() => {
        return () => stopWaveform()
    }, [])

    React.useEffect(() => {
        if (!canvasRef.current) return
        const width = 200
        const height = 50
        canvasRef.current.width = width
        canvasRef.current.height = height
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
            ctx.clearRect(0, 0, width, height)
            const step = data.samples.length / width
            for (let i = 0; i < width; i++) {
                const maxValue = data.samples
                    .slice(Math.floor(i * step), Math.ceil((i + 1) * step))
                    .reduce((max, sample) => {
                        return Math.max(max, Math.abs(sample))
                    }, 0)
                const sampleValue = maxValue ?? 0
                const barHeight = (sampleValue * height) / 2
                ctx.fillStyle = "white"
                ctx.fillRect(i, height / 2 - barHeight, 1, barHeight * 2)
            }
        }
    }, [data, canvasRef.current])

    React.useEffect(() => {
        // Stop waveform if new data is received while playing
        if (playbackPosition !== null) {
            stopWaveform()
        }
    }, [data])

    const playWaveform = () => {
        if (playbackPosition !== null) {
            stopWaveform()
            return
        }
        if (data.samples.length === 0) return
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // AudioBuffer cannot be created outside this range
        const clampedSampleRate = Math.max(
            3000,
            Math.min(data.sampleRate, 768000),
        )
        const ratio = data.sampleRate / clampedSampleRate
        const audioBuffer = audioContext.createBuffer(
            1,
            Math.floor(data.samples.length / ratio),
            clampedSampleRate,
        )
        const channelData = audioBuffer.getChannelData(0)
        if (audioBuffer.length !== data.samples.length) {
            // If the AudioBuffer length was clamped, we need to resample the data to fit
            const ratio = data.samples.length / audioBuffer.length
            for (let i = 0; i < audioBuffer.length; i++) {
                const position = i * ratio
                if (1 - (position % 1) < 0.5) {
                    channelData[i] = data.samples[Math.ceil(position)] ?? 0
                } else {
                    channelData[i] = data.samples[Math.floor(position)] ?? 0
                }
            }
        } else {
            for (let i = 0; i < data.samples.length; i++) {
                channelData[i] = Math.max(-1, Math.min(1, data.samples[i]))
            }
        }

        const source = audioContext.createBufferSource()
        sourceRef.current = source
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        source.onended = () => {
            if (sourceRef.current === source) {
                sourceRef.current = null
            }
            if (audioContextRef.current === audioContext) {
                audioContextRef.current = null
            }
            if (playbackHeadRef.current) {
                cancelAnimationFrame(playbackHeadRef.current)
                playbackHeadRef.current = 0
            }
            void audioContext.close()
            setPlaybackPosition(null)
        }
        function raf() {
            playbackHeadRef.current = requestAnimationFrame(raf)
            if (!audioContextRef.current) return
            const currentTime = audioContextRef.current.currentTime
            setPlaybackPosition(currentTime)
        }
        playbackHeadRef.current = requestAnimationFrame(raf)

        source.start()
        setPlaybackPosition(audioContext.currentTime)
    }

    function secondsToTime(sec: number) {
        const minutes = Math.floor(sec / 60)
        const seconds = Math.floor(sec % 60)
        const milliseconds = Math.floor((sec - Math.floor(sec)) * 1000)

        return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
            .toString()
            .padStart(3, "0")}`
    }

    const time =
        data.samples.length / data.sampleRate >= 0.001
            ? `${secondsToTime(playbackPosition ?? 0)} / ${secondsToTime(data.samples.length / data.sampleRate)}`
            : `${data.samples.length} samples`

    return (
        <div className="waveform-visualizer">
            <canvas
                width={200}
                height={50}
                className="waveform-canvas"
                ref={canvasRef}
            ></canvas>
            <button
                onMouseDown={(e) => {
                    e.stopPropagation()
                    playWaveform()
                }}
                title={
                    playbackPosition !== null
                        ? "Stop playback"
                        : "Start playback"
                }
            >
                {playbackPosition !== null ? "⏹" : "►"}
            </button>
            {playbackPosition !== null && (
                <div
                    className="waveform-playback-head"
                    style={
                        {
                            "--percent": `${playbackPosition / (data.samples.length / data.sampleRate)}`,
                        } as React.CSSProperties
                    }
                ></div>
            )}
            <div className="waveform-samplerate">
                {data.sampleRate} Hz · {time}
            </div>
        </div>
    )
}
function GraphVisualizer({
    values,
    index,
}: {
    values: DataType[]
    index: number
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const graphData = values[index] as DataType & { kind: "graph" }
    const graph = graphData.value

    React.useEffect(() => {
        if (!canvasRef.current) return
        const width = 200
        const height = 200
        canvasRef.current.width = width
        canvasRef.current.height = height
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
            ctx.clearRect(0, 0, width, height)
            // scale graph to fit in canvas
            const min = Vector.one(2).mul(Number.MAX_SAFE_INTEGER)
            const max = Vector.one(2).mul(Number.MIN_SAFE_INTEGER)
            graph.nodes.forEach((node) => {
                for (let i = 0; i < 2; i++) {
                    const node_comp = node.get(i)
                    if (node_comp < min.get(i)) min.set(i, node_comp)
                    if (node_comp > max.get(i)) max.set(i, node_comp)
                }
            })
            const graph_size = new Vector([
                max.x() - min.x(),
                max.y() - min.y(),
            ])
            const scale =
                190 /
                (graph_size.x() > graph_size.y()
                    ? graph_size.x()
                    : graph_size.y())
            const margins = new Vector([
                (200 - graph_size.x() * scale) / 2,
                (200 - graph_size.y() * scale) / 2,
            ])
            const scaled = new Graph()
            for (let i = 0; i < graph.nodes.length; i++) {
                scaled.nodes.push(
                    graph.nodes[i].sub(min).mul(scale).add(margins),
                )
            }
            // draw all edges
            ctx.strokeStyle = "white"
            ctx.lineWidth = 2
            graph.get_edge_list().forEach((edge) => {
                const a = scaled.nodes[edge[0]]
                const b = scaled.nodes[edge[1]]
                ctx.beginPath()
                ctx.moveTo(a.x(), a.y())
                ctx.lineTo(b.x(), b.y())
                ctx.stroke()
            })
            // draw all nodes
            ctx.fillStyle = "white"
            scaled.nodes.forEach((node) => {
                ctx.beginPath()
                ctx.arc(node.x(), node.y(), 3, 0, Math.PI * 2)
                ctx.fill()
            })
        }
    }, [graphData, canvasRef.current])

    return <canvas className="image-visualizer" ref={canvasRef}></canvas>
}

function DataVisualizer({
    values,
    index,
}: {
    values: DataType[]
    index: number
}) {
    const data = values[index]

    if (data.kind === "text") {
        return <div>{data.value}</div>
    } else if (data.kind === "value") {
        return <div>{data.value}</div>
    } else if (data.kind === "state") {
        return (
            <div className={data.value ? "state-on" : "state-off"}>
                {data.value ? "true" : "false"}
            </div>
        )
    } else if (data.kind === "event") {
        return (
            <div className="event-indicator">
                <span>emits {data.eventName ?? "events"}</span>
            </div>
        )
    } else if (data.kind === "geolocation") {
        return (
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?q=${data.latitude},${data.longitude}&zoom=10&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
            ></iframe>
        )
    } else if (data.kind === "color") {
        return (
            <div
                style={{
                    backgroundColor: `rgba(${data.r}, ${data.g}, ${data.b}, ${data.a})`,
                    width: "100%",
                    height: "16px",
                }}
            ></div>
        )
    } else if (data.kind === "image" || data.kind === "depthmap") {
        let imageData: ImageData
        if (data.kind === "depthmap") {
            // Turn depthmap into grayscale image data for visualization
            imageData = new ImageData(data.width, data.height)
            for (let i = 0; i < data.values.length; i++) {
                const depthValue = data.values[i]
                const gray = Math.min(
                    255,
                    Math.max(0, Math.min(depthValue, 255)),
                )
                imageData.data[i * 4 + 0] = gray // R
                imageData.data[i * 4 + 1] = gray // G
                imageData.data[i * 4 + 2] = gray // B
                imageData.data[i * 4 + 3] = 255 // A
            }
        } else {
            imageData = data.data
        }

        return <ImageVisualizer values={values} index={index} />
    } else if (data.kind === "vector") {
        return (
            <div>
                (
                {data.value.components
                    .slice(0, 20)
                    .map((comp) => comp.toFixed(2))
                    .join(", ")}
                {data.value.components.length > 20
                    ? `... (${data.value.components.length} vectors)`
                    : ""}
                )
            </div>
        )
    } else if (data.kind === "vectorfield") {
        return (
            <div>
                {data.vectors.map((vec, idx) => (
                    <div key={idx}>
                        (
                        {vec.value.components
                            .slice(0, 20)
                            .map((comp) => comp.toFixed(2))
                            .join(", ")}
                        {vec.value.components.length > 20
                            ? `... (${vec.value.components.length} vectors)`
                            : ""}
                        )
                    </div>
                ))}
            </div>
        )
    } else if (data.kind === "curve") {
        const sampleCount = 200
        const samples = new Array(sampleCount)
            .fill(0)
            .map((_, i) => i / (sampleCount - 1))
            .map((t) => data.value.getValue(t))
            .filter(
                (x) =>
                    x && x.length >= 2 && x.every((c) => typeof c === "number"),
            ) as [number, number][]
        const bounds = [0, 0, 0, 0] // minX, minY, maxX, maxY
        samples.forEach(([x, y]) => {
            if (x < bounds[0]) bounds[0] = x
            if (y < bounds[1]) bounds[1] = y
            if (x > bounds[2]) bounds[2] = x
            if (y > bounds[3]) bounds[3] = y
        })
        return (
            <svg
                width="100%"
                height="100%"
                viewBox={`${bounds[0]} ${bounds[1]} ${bounds[2] - bounds[0]} ${bounds[3] - bounds[1]}`}
            >
                <path
                    d={
                        "M " +
                        samples
                            .map((t) => {
                                return `${t[0]},${t[1]}`
                            })
                            .join(" L ")
                    }
                    fill="none"
                    strokeWidth={(bounds[2] - bounds[0]) / 100}
                    stroke={
                        data.value.color
                            ? `rgba(${data.value.color.join(",")}`
                            : "white"
                    }
                />
            </svg>
        )
    } else if (data.kind === "shape") {
        const value = data.value.filter(
            (curve): curve is { getValue: (t: number) => number[] } =>
                typeof curve?.getValue === "function",
        )
        if (value.length === 0) {
            return <div>Invalid shape data</div>
        }
        const sampleCount = 200
        const samples: [number, number][] = new Array(
            sampleCount * value.length,
        )
            .fill(0)
            .map((_, i) => i / (sampleCount - 1))
            .map((t, i) => value[Math.floor(i / sampleCount)].getValue(t))
            .filter(
                (x) =>
                    x && x.length >= 2 && x.every((c) => typeof c === "number"),
            ) as [number, number][]

        const bounds = [0, 0, 0, 0] // minX, minY, maxX, maxY
        samples.forEach(([x, y]) => {
            if (x < bounds[0]) bounds[0] = x
            if (y < bounds[1]) bounds[1] = y
            if (x > bounds[2]) bounds[2] = x
            if (y > bounds[3]) bounds[3] = y
        })
        return (
            <svg
                viewBox={`${bounds[0]} ${bounds[1]} ${bounds[2] - bounds[0]} ${bounds[3] - bounds[1]}`}
            >
                <path
                    d={
                        "M " +
                        samples
                            .map((t) => {
                                return `${t[0]},${t[1]}`
                            })
                            .join(" L ")
                    }
                    fill="none"
                    strokeWidth={(bounds[2] - bounds[0]) / 100}
                    stroke={
                        data.value[0]?.color
                            ? `rgba(${data.value[0]?.color.join(",")}`
                            : "white"
                    }
                />
            </svg>
        )
    } else if (data.kind === "waveform") {
        return <WaveformVisualizer values={values} index={index} />
    } else if (data.kind === "graph") {
        return <GraphVisualizer values={values} index={index} />
    } else {
        return <div>No visualization available</div>
    }
}

export default React.memo(DataVisualizer)
