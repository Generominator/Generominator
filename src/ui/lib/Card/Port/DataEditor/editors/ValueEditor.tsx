import React from "react"
import "../dataEditor.css"

function ValueEditor({
    value,
    onChange = () => {},
}: {
    value: number
    onChange: (newValue: number) => void
}) {
    const ref = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        // React overrides the onChange handler of the input with one that
        // fires every single time the value changes, which causes a lot of lag.
        // Set the onchange handler manually.
        if (ref.current) ref.current.onchange = onInputEnd
    }, [ref.current])

    function onInputEnd() {
        if (
            ref.current &&
            !isNaN(Number(ref.current.value)) &&
            value !== Number(ref.current.value)
        ) {
            onChange(Number(ref.current.value))
        }
        ref.current?.blur()
    }

    return (
        <input
            ref={ref}
            className="value-input"
            type="number"
            defaultValue={value}
            onBlur={onInputEnd}
        />
    )
}

export default ValueEditor
