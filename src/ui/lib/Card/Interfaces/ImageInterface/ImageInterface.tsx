import "./imageInterface.css"
import type { ArtworkCard } from "../../../../../cards/artwork"

function ImageInterface({
    card,
    disabled = false,
}: {
    card: ArtworkCard
    disabled?: boolean
}) {
    return (
        <select
            className={"image-card-input" + (disabled ? " disabled" : "")}
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

export default ImageInterface
