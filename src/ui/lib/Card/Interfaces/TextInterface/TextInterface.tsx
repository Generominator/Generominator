import "./textInterface.css"
import type { Text } from "../../../../../cards/text"

function TextInterface({
    card,
    disabled = false,
}: {
    card: Text
    disabled?: boolean
}) {
    return (
        <select
            className={"text-card-input" + (disabled ? " disabled" : "")}
            disabled={disabled}
            defaultValue={(card as Text).selected}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => (card as Text).setSelected(e.target.value)}
        >
            {Object.keys(card.options).map((key) => (
                <option key={key} value={key}>
                    {key}
                </option>
            ))}
        </select>
    )
}

export default TextInterface
