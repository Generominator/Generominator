import "./scaleMethodInterface.css"

interface ScalableCard {
    method: string
    methods: string[]
    setMethod: (method: string) => void
}

function ScaleMethodInterface({
    card,
    disabled = false,
}: {
    card: ScalableCard
    disabled?: boolean
}) {
    return (
        <select
            className={"scale-method-select" + (disabled ? " disabled" : "")}
            disabled={disabled}
            defaultValue={card.method}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => card.setMethod(e.target.value)}
        >
            {card.methods.map((m) => (
                <option key={m} value={m}>
                    {m}
                </option>
            ))}
        </select>
    )
}

export default ScaleMethodInterface
