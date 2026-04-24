import "./constTextInterface.css"

function ConstTextInterface({
    card,
    disabled = false,
}: {
    card: { cardString: string; setValue: (v: string) => void }
    disabled?: boolean
}) {
    return (
        <input
            className={"const-text-input" + (disabled ? " disabled" : "")}
            type="text"
            disabled={disabled}
            defaultValue={card.cardString}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => card.setValue(e.target.value)}
        />
    )
}

export default ConstTextInterface
