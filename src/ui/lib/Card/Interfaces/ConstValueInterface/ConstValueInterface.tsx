import "./constValueInterface.css"

function ConstValueInterface({
    card,
    disabled = false,
}: {
    card: { number: number }
    disabled?: boolean
}) {
    return (
        <input
            className={"const-value-input" + (disabled ? " disabled" : "")}
            type="number"
            disabled={disabled}
            defaultValue={card.number}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => (card.number = Number(e.target.value))}
        />
    )
}

export default ConstValueInterface
