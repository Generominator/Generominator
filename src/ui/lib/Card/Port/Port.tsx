import React from "react"
import { defaultValues, type DataType } from "../../../../cardBase/dataTypes"
import type { Port as PortType } from "../../../../cardBase/ports/port"
import DataVisualizer from "./DataVisualizer/DataVisualizer"
import DataEditor from "./DataEditor/DataEditor"

function InputPort({
    port,
    connected = false,
    setConstValue = () => {},
    index,
    value,
}: {
    port: PortType
    connected?: boolean
    setConstValue?: (value: DataType | null) => void
    index: number
    value?: DataType | null
}) {
    const [currentConstValue, setCurrentConstValue] =
        React.useState<DataType | null>(value ?? null)

    React.useEffect(() => {
        if (
            value !== null &&
            value !== undefined &&
            port.dataType !== "generic" &&
            value.kind !== port.dataType
        ) {
            setCurrentConstValue(null)
            setConstValue(null)
            return
        }
        setCurrentConstValue(value ?? null)
    }, [value, port.dataType, setConstValue])

    const setConstValueWrapper = React.useCallback(
        (value: DataType | null) => {
            setCurrentConstValue(value)
            setConstValue(value)
        },
        [setConstValue],
    )

    return (
        <div className="port" data-port-index={index}>
            {!connected && (
                <div
                    className="floating-editor"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <DataEditor
                        optional={port.optional}
                        dataType={port.dataType}
                        defaultValue={
                            port.defaultValue ??
                            defaultValues.find(
                                (x) => x.kind === port.dataType,
                            ) ??
                            null
                        }
                        value={currentConstValue}
                        onChange={setConstValueWrapper}
                    />
                </div>
            )}
            <img src={"datatypes/" + port.dataType + ".png"} />
            {port.label && <span>{port.label}</span>}
        </div>
    )
}

interface InputInterface {
    port: PortType
    connected?: boolean
    setConstValue?: (value: DataType | null) => void
    type: "input"
    index: number
    values?: Array<DataType | null> | null
}
interface OutputInterface {
    port: PortType
    connected?: boolean
    setConstValue?: (value: DataType | null) => void
    type: "output"
    index: number
    values?: DataType[] | null
}

function Port({
    port,
    connected = false,
    setConstValue = () => {},
    type,
    index,
    values,
}: InputInterface | OutputInterface) {
    if (type === "input") {
        return (
            <InputPort
                port={port}
                connected={connected}
                setConstValue={setConstValue}
                index={index}
                value={values?.[index] ?? null}
            />
        )
    } else {
        return (
            <div className="port" data-port-index={index}>
                {port.label && <span>{port.label}</span>}
                <img src={"datatypes/" + port.dataType + ".png"} />
                {values?.[index] && (
                    <div
                        className="floating-editor"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <DataVisualizer values={values} index={index} />
                    </div>
                )}
            </div>
        )
    }
}

export default Port
