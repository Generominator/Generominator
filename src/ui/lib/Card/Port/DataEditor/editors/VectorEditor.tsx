import React, { useEffect } from "react"
import "../dataEditor.css"
import ValueEditor from "./ValueEditor"

function VectorEditor({
    value,
    onChange = () => {},
}: {
    value: number[]
    onChange: (newValue: number[]) => void
}) {
    const [internalValue, setInternalValue] = React.useState<number[]>([
        ...value,
    ])

    function update(index: number, newValue: number) {
        setInternalValue((prev) => {
            const newArr = [...prev]
            newArr[index] = newValue
            return newArr
        })
    }

    useEffect(() => {
        onChange(internalValue)
    }, [internalValue])

    useEffect(() => {
        if (value.join(",") !== internalValue.join(",")) {
            setInternalValue([...value])
        }
    }, [value])

    function addDimension() {
        setInternalValue((prev) => {
            prev.push(0)
            return [...prev]
        })
    }

    function removeDimension(index: number) {
        setInternalValue((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <>
            {internalValue.map((x, i) => (
                <div className="vector" key={`${x}-${i}`}>
                    <ValueEditor value={x} onChange={update.bind(null, i)} />
                    <button
                        title="Remove dimension"
                        onClick={removeDimension.bind(null, i)}
                    >
                        -
                    </button>
                </div>
            ))}
            <button
                title="Add dimension"
                className="nowrap"
                disabled={internalValue.length >= 5}
                onClick={addDimension}
            >
                + dimension
            </button>
        </>
    )
}

export default VectorEditor
