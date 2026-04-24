import React from "react"
import "./SaveModal.css"
import { weave } from "../steganography"

function drawTextLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
) {
    const words = text.split(" ")
    const lines = []
    let currentLine = words[0]

    if (words[0].includes("\n")) {
        const parts = words[0].split("\n")
        lines.push(...parts.slice(0, -1))
        currentLine = parts.slice(-1)[0]
    }

    for (let i = 1; i < words.length; i++) {
        let word = words[i]
        if (word.includes("\n")) {
            word = word.split("\n")[0]
        }
        const width = ctx.measureText(currentLine + " " + word).width
        if (width < maxWidth) {
            currentLine += " " + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
        if (words[i].includes("\n")) {
            for (const part of words[i].split("\n").slice(1)) {
                lines.push(currentLine)
                currentLine = part
            }
        }
    }
    lines.push(currentLine)

    const lineHeight = parseInt(ctx.font) * 1.2 // Adjust line height based on font size
    lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight)
    })
    return lines.length * parseInt(ctx.font) * 1.2 // Return total height of the text block
}

function SaveModal({
    onSave,
    onClose,
}: {
    onSave: () => Promise<string>
    onClose: () => void
}) {
    const ref = React.useRef<HTMLCanvasElement>(null)
    const [name, setName] = React.useState<string>("")
    const [description, setDescription] = React.useState<string>("")
    const [color, setColor] = React.useState<number>(0)
    const [jsonString, setJsonString] = React.useState<string>("")
    const [percentFull, setPercentFull] = React.useState<number>(0)

    React.useEffect(() => {
        if (ref.current == null) return
        onSave().then((json) => {
            setJsonString(json)
            createCard()
        })
    }, [onSave, ref.current])

    function createCard() {
        if (ref.current == null) return

        const ctx = ref.current.getContext("2d")
        if (ctx == null) return

        ctx.beginPath()
        ctx.fillStyle = `hsl(${color}, 90%, 80%)`
        ctx.roundRect(0, 0, ref.current.width, ref.current.height, 10)
        ctx.fill()

        ctx.beginPath()
        ctx.fillStyle = `hsl(${color}, 92%, 90%)`
        ctx.strokeStyle = "white"
        ctx.lineWidth = 3
        ctx.roundRect(
            10,
            10,
            ref.current.width - 20,
            ref.current.height - 20,
            5,
        )
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = "#000"
        ctx.font = "36px titleFont"
        ctx.textAlign = "center"
        let y = ref.current.height / 4
        y += drawTextLines(
            ctx,
            name || "My Generominator",
            ref.current.width / 2,
            y,
            ref.current.width - 60,
        )
        ctx.font = "20px labelFont"
        drawTextLines(
            ctx,
            description,
            ref.current.width / 2,
            y,
            ref.current.width - 60,
        )

        // Encode least bit stegonography of the json string
        const json_bytes = new TextEncoder().encode(jsonString)
        const imageData = ctx.getImageData(
            0,
            0,
            ref.current.width,
            ref.current.height,
        )
        const percent = weave(imageData.data.buffer, json_bytes.buffer)
        setPercentFull(percent)
        if (percent > 1) {
            console.warn(
                "JSON string is too long to fit in the image! It will be truncated.",
            )
        }

        ctx.putImageData(imageData, 0, 0)
    }

    async function saveCard() {
        if (ref.current == null) return
        createCard()
        const link = document.createElement("a")
        link.download = `${name || "generominator"}.png`
        link.href = ref.current.toDataURL("image/png")
        link.click()
        link.remove()
        onClose()
    }

    function saveJSON() {
        const blob = new Blob([jsonString], { type: "application/json" })
        const link = document.createElement("a")
        link.download = `${name || "generominator"}.json`
        link.href = URL.createObjectURL(blob)
        link.click()
        onClose()
    }

    React.useEffect(() => {
        createCard()
    }, [name, description, color])

    return (
        <div className="save-modal" onClick={() => onClose()}>
            <div
                className="save-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="save-settings">
                    <h2>Save your graph</h2>
                    <label htmlFor="name">Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        id="name"
                        type="text"
                        placeholder="Enter card name..."
                    />
                    <label htmlFor="description">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        id="description"
                        placeholder="Describe your card..."
                    />
                    <label>Color</label>
                    <div className="colors">
                        {new Array(16).fill(0).map((_, i) => (
                            <button
                                key={i}
                                className="color-option"
                                style={{
                                    backgroundColor: `hsl(${i * 22.5}, 90%, 80%)`,
                                    border:
                                        color === i * 22.5
                                            ? "3px solid white"
                                            : "none",
                                }}
                                onClick={() => setColor(i * 22.5)}
                            />
                        ))}
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{
                                width: `${Math.min(percentFull, 1) * 100}%`,
                                backgroundColor:
                                    percentFull >= 1 ? "red" : "#ccc",
                            }}
                        />
                    </div>
                    <span style={{ color: percentFull >= 1 ? "red" : "" }}>
                        {(percentFull * 100).toFixed(2)}% used on Card
                    </span>
                    <button disabled={percentFull >= 1} onClick={saveCard}>
                        {percentFull >= 1 ? "Graph too big" : "Save Card"}
                    </button>
                    <hr />
                    <p>
                        You can also save your system as JSON to edit more
                        easily.
                    </p>
                    <button onClick={saveJSON}>Save as JSON</button>
                </div>
                <canvas ref={ref} width={440} height={293}></canvas>
            </div>
        </div>
    )
}

export default React.memo(SaveModal)
