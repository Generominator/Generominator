import React from "react"
import type { DataType } from "../../../cardBase/dataTypes"

export interface QuickAddPopupOption {
    key: string
    title: string
    description: string
    portIndex: number
    totalPorts: number
}

function QuickAddPopup<T extends QuickAddPopupOption>({
    options,
    dataType,
    style,
    onSelect,
    onClose,
}: {
    options: T[]
    dataType: DataType["kind"]
    style?: React.CSSProperties
    onSelect: (option: T) => void
    onClose: () => void
}) {
    const [query, setQuery] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(0)
    const popupRef = React.useRef<HTMLDivElement>(null)
    const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])
    const filtered = React.useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (normalized === "") return options
        return options.filter(
            (option) =>
                option.title.toLowerCase().includes(normalized) ||
                option.description.toLowerCase().includes(normalized),
        )
    }, [options, query])
    React.useEffect(() => {
        if (filtered.length === 0) {
            setHighlightedIndex(-1)
            return
        }
        setHighlightedIndex((index) =>
            index < 0 || index >= filtered.length ? 0 : index,
        )
    }, [filtered.length])
    React.useEffect(() => {
        if (highlightedIndex < 0) return
        const selectedElem = optionRefs.current[highlightedIndex]
        selectedElem?.scrollIntoView({ block: "nearest" })
    }, [highlightedIndex, filtered])
    React.useEffect(() => {
        function handleOutsidePointerDown(event: PointerEvent) {
            const target = event.target as Node | null
            if (!target || popupRef.current?.contains(target)) return
            onClose()
        }

        function handleFocusIn(event: FocusEvent) {
            const target = event.target as Node | null
            if (!target || popupRef.current?.contains(target)) return
            onClose()
        }

        document.addEventListener("pointerdown", handleOutsidePointerDown, true)
        document.addEventListener("focusin", handleFocusIn)

        return () => {
            document.removeEventListener(
                "pointerdown",
                handleOutsidePointerDown,
                true,
            )
            document.removeEventListener("focusin", handleFocusIn)
        }
    }, [onClose])

    function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
        if (e.key === "Escape") {
            e.preventDefault()
            e.stopPropagation()
            onClose()
            return
        }
        if (filtered.length === 0) return
        if (e.key === "ArrowDown") {
            e.preventDefault()
            e.stopPropagation()
            setHighlightedIndex((index) => (index + 1) % filtered.length)
            return
        }
        if (e.key === "ArrowUp") {
            e.preventDefault()
            e.stopPropagation()
            setHighlightedIndex(
                (index) => (index - 1 + filtered.length) % filtered.length,
            )
            return
        }
        if (e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            const option = filtered[highlightedIndex]
            if (option) onSelect(option)
        }
    }

    return (
        <div
            ref={popupRef}
            className="quick-add-popup"
            style={style}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDownCapture={onKeyDown}
        >
            <div className="quick-add-popup-title">Add Connected Card</div>
            <img
                className="quick-add-popup-datatype"
                width="20"
                height="20"
                src={"datatypes/" + dataType + ".png"}
            />
            <input
                className="quick-add-filter"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filter ${options.length} cards...`}
                autoFocus
            />
            <div className="quick-add-results">
                {filtered.length === 0 && (
                    <div className="quick-add-empty">No matching cards</div>
                )}
                {filtered.map((option, index) => (
                    <button
                        key={`${option.key}-${option.portIndex}`}
                        ref={(elem) => {
                            optionRefs.current[index] = elem
                        }}
                        className={
                            "quick-add-option" +
                            (index === highlightedIndex ? " active" : "")
                        }
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => onSelect(option)}
                    >
                        <div className="quick-add-option-title">
                            {option.title}
                        </div>
                        {option.description && (
                            <div className="quick-add-option-description">
                                {option.description}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default QuickAddPopup
