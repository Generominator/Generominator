import "./combineDepthMapInterface.css"
import type { CombineDepthMapsCard } from "../../../../../cards/depthMapCombine"

function CombineDepthMapInterface({
    card,
    disabled = false,
}: {
    card: CombineDepthMapsCard
    disabled?: boolean
}) {
    return (
        <select
            className={
                "combine-depthmap-select" + (disabled ? " disabled" : "")
            }
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

export default CombineDepthMapInterface
