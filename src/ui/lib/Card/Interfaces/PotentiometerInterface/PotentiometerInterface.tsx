import React from "react"
import "./potentiometerInterface.css"
import type { Potentiometer } from "../../../../../cards/potentiometer"

function PotentiometerInterface({
    card,
    disabled = false,
}: {
    card: Potentiometer
    disabled?: boolean
}) {
    const [mousePos, setMousePos] = React.useState<[number, number] | null>(
        null,
    )
    const [value, setValue] = React.useState<number>(card.value)

    React.useEffect(() => {
        setValue(card.value)
    }, [card])

    React.useEffect(() => {
        if (mousePos) {
            document.addEventListener("mousemove", dragMove)
            document.addEventListener("mouseup", dragEnd)
            return () => {
                document.removeEventListener("mousemove", dragMove)
                document.removeEventListener("mouseup", dragEnd)
            }
        }
    }, [mousePos])

    function dragStart(e: React.MouseEvent) {
        setMousePos([e.clientX, e.clientY])
        e.stopPropagation()
        e.preventDefault()
        console.log("drag start")
    }

    function dragMove(e: MouseEvent) {
        if (!mousePos || disabled) return
        const deltaY = e.clientY - mousePos[1]
        const deltaX = e.clientX - mousePos[0]
        let newValue = value - deltaY + deltaX
        newValue = Math.max(
            0,
            Math.min(360, (newValue < 0 ? newValue + 360 : newValue) % 360),
        )
        setValue(newValue)
        card.setValue(newValue)
    }

    function dragEnd() {
        setMousePos(null)
    }

    return (
        <div
            className={"potentiometer" + (disabled ? " disabled" : "")}
            onMouseDown={dragStart}
        >
            <div className="potentiometer-knob">
                <div
                    className="potentiometer-indicator"
                    style={{ transform: `rotate(${value}deg)` }}
                />
            </div>
            <div className="potentiometer-value">{Math.round(value)}</div>
        </div>
    )
}

export default PotentiometerInterface
