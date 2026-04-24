import React from "react"
import "../dataEditor.css"

const fromHex = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
}

const toHex = (r: number, g: number, b: number): string => {
    const toByte = (c: number): number =>
        c <= 1 ? c * 255 : Math.min(255, Math.max(0, c))
    return (
        "#" +
        [r, g, b]
            .map((c) => Math.round(toByte(c)).toString(16).padStart(2, "0"))
            .join("")
    )
}

function ColorEditor({
    value,
    onChange = () => {},
}: {
    value: [number, number, number, number]
    onChange: (newValue: typeof value) => void
}) {
    const [hex, setHex] = React.useState(toHex(value[0], value[1], value[2]))
    const ref = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        setHex(toHex(value[0], value[1], value[2]))
    }, [value])

    function commitHex(nextHex: string) {
        onChange([...fromHex(nextHex), value[3]])
    }

    return (
        <>
            <button
                className="const-color-btn"
                style={{
                    color:
                        fromHex(hex).reduce((a, b) => a + b, 0) > 382.5
                            ? "black"
                            : "white",
                    backgroundColor: `rgba(${[...fromHex(hex), value[3]].join(",")})`,
                }}
                onClick={() => ref.current?.click()}
            >
                {[...fromHex(hex), value[3]].join(", ")}
            </button>
            <input
                ref={ref}
                className="const-color-input-elem"
                type="color"
                value={hex}
                onChange={(e) => {
                    const nextHex = e.target.value
                    setHex(nextHex)
                    commitHex(nextHex)
                }}
                onBlur={() => commitHex(ref.current?.value ?? hex)}
            />
        </>
    )
}

export default ColorEditor
