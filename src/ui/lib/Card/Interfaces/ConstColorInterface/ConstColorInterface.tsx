import "./constColorInterface.css"
import type { ConstColorCard } from "../../../../../cards/constColorCard"

function ConstColorInterface({
    card,
    disabled = false,
}: {
    card: ConstColorCard
    disabled?: boolean
}) {
    return (
        <select
            className={"const-color-input" + (disabled ? " disabled" : "")}
            disabled={disabled}
            defaultValue={(card as ConstColorCard).selected}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) =>
                (card as ConstColorCard).setSelected(e.target.value)
            }
        >
            {Object.keys(card.options).map((key) => (
                <option key={key} value={key}>
                    {key}
                </option>
            ))}
        </select>
    )
}

export default ConstColorInterface
