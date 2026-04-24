import React from "react"
import type { buttonCard } from "../../../../../cards/buttonCard"
import "./buttonInterface.css"

function ButtonInterface({
    card,
    disabled = false,
}: {
    card: buttonCard
    disabled?: boolean
}) {
    // Track local state for UI update
    const [pressed, setPressed] = React.useState(card.cardState)

    React.useEffect(() => {
        setPressed(card.cardState)
    }, [card.cardState])

    function handleMouseDown(e: React.MouseEvent) {
        e.stopPropagation()
        card.setValue(true)
        setPressed(true)
    }

    function handleMouseUp(e: React.MouseEvent) {
        e.stopPropagation()
        card.setValue(false)
        setPressed(false)
    }

    return (
        <button
            className={
                "button-card-ui" +
                (pressed ? " pressed" : "") +
                (disabled ? " disabled" : "")
            }
            disabled={disabled}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {pressed ? "Release Me!" : "Press Me!"}
        </button>
    )
}

export default ButtonInterface
