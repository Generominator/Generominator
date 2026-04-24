import "./basicShapeInterface.css"
import type { BasicShapeCard } from "../../../../../cards/basicShape"

function BasicShapeInterface({
    card,
    disabled = false,
}: {
    card: BasicShapeCard
    disabled?: boolean
}) {
    return (
        <select
            className={"basic-shape-input" + (disabled ? " disabled" : "")}
            disabled={disabled}
            defaultValue={card.selected}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => card.setSelected(e.target.value)}
        >
            {Object.keys(card.options).map((key) => (
                <option key={key} value={key}>
                    {key}
                </option>
            ))}
        </select>
    )
}

export default BasicShapeInterface
