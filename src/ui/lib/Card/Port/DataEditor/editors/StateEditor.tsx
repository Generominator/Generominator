import React from "react"
import "../dataEditor.css"

function StateEditor({
    value,
    onChange = () => {},
}: {
    value: boolean
    onChange: (newValue: boolean) => void
}) {
    const [state, setState] = React.useState(value)

    React.useEffect(() => {
        setState(value)
    }, [value])

    return (
        <button
            className={"state-button " + (state ? "state-on" : "state-off")}
            onClick={() => {
                const newState = !state
                setState(newState)
                onChange(newState)
            }}
        >
            {state ? "true" : "false"}
        </button>
    )
}

export default StateEditor
