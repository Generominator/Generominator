import React from "react"
import "../dataEditor.css"

function TextEditor({
    value,
    onChange = () => {},
}: {
    value: string
    onChange: (newValue: string) => void
}) {
    const ref = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        // React overrides the onChange handler of the input with one that
        // fires every single time the value changes, which causes a lot of lag.
        // Set the onchange handler manually.
        if (ref.current) ref.current.onchange = onInputEnd
    }, [ref.current])

    function onInputEnd() {
        if (ref.current && value !== ref.current.value) {
            onChange(ref.current.value)
        }
        ref.current?.blur()
    }

    return (
        <input
            ref={ref}
            className="value-input text-editor-input"
            type="text"
            defaultValue={value}
            onBlur={onInputEnd}
        />
    )
}

export default TextEditor
