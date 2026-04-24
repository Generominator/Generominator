import React from "react"
import "./dataEditor.css"
import {
    Vector,
    type DataTypeOf,
    type DataType,
} from "../../../../../cardBase/dataTypes"
import TextEditor from "./editors/TextEditor"
import ValueEditor from "./editors/ValueEditor"
import ColorEditor from "./editors/ColorEditor"
import ImageEditor from "./editors/ImageEditor"
import VectorEditor from "./editors/VectorEditor"
import GeolocationEditor from "./editors/GeolocationEditor"
import WaveformEditor from "./editors/WaveformEditor"
import StateEditor from "./editors/StateEditor"

const cloneWaveform = (
    waveform: DataTypeOf<"waveform">,
): DataTypeOf<"waveform"> => ({
    kind: "waveform",
    samples: [...waveform.samples],
    sampleRate: waveform.sampleRate,
})

function InnerEditor({
    value,
    onChange = () => {},
}: {
    value: DataType
    onChange: (data: DataType | null) => void
}) {
    switch (value.kind) {
        case "text":
            return (
                <TextEditor
                    value={value.value}
                    onChange={(v) => onChange({ kind: "text", value: v })}
                />
            )
        case "value":
            return (
                <ValueEditor
                    value={value.value}
                    onChange={(v) => onChange({ kind: "value", value: v })}
                />
            )
        case "state":
            return (
                <StateEditor
                    value={value.value}
                    onChange={(v) => onChange({ kind: "state", value: v })}
                />
            )
        case "color":
            return (
                <ColorEditor
                    value={[value.r, value.g, value.b, value.a]}
                    onChange={(v) =>
                        onChange({
                            kind: "color",
                            r: v[0],
                            g: v[1],
                            b: v[2],
                            a: v[3],
                        })
                    }
                />
            )
        case "image":
            return (
                <ImageEditor
                    value={value.data}
                    onChange={(v) => onChange({ kind: "image", data: v })}
                />
            )
        case "waveform":
            return (
                <WaveformEditor
                    value={value}
                    onChange={(v) => onChange(cloneWaveform(v))}
                />
            )
        case "depthmap":
            return (
                <ImageEditor
                    value={
                        new ImageData(
                            new Uint8ClampedArray(
                                value.values.flatMap((v) => [v, v, v, 255]),
                            ),
                            value.width,
                            value.height,
                        )
                    }
                    onChange={(v) =>
                        onChange({
                            kind: "depthmap",
                            values: Array.from(v.data).filter(
                                (_, i) => i % 4 === 0,
                            ),
                            width: v.width,
                            height: v.height,
                        })
                    }
                />
            )
        case "vector":
            return (
                <VectorEditor
                    value={[...value.value.components]}
                    onChange={(v) =>
                        onChange({ kind: "vector", value: new Vector([...v]) })
                    }
                />
            )
        case "geolocation":
            return (
                <GeolocationEditor
                    value={{
                        longitude: value.longitude,
                        latitude: value.latitude,
                    }}
                    onChange={(v) =>
                        onChange({
                            kind: "geolocation",
                            longitude: v.longitude,
                            latitude: v.latitude,
                        })
                    }
                />
            )
        default:
            return <div>Can&apos;t edit {value.kind}s</div>
    }
}

function DataEditor({
    value,
    dataType,
    optional,
    defaultValue,
    onChange = () => {},
}: {
    value: DataType | null
    dataType: DataType["kind"]
    optional?: boolean
    defaultValue: DataType | null
    onChange: (data: DataType | null) => void
}) {
    if (dataType === "generic") {
        return <div>Accepts all data</div>
    }
    if (value === null) {
        if (!optional) {
            // For types with uploads, show the upload button immediately even with no value
            // so that the user can immediately set a value
            if (dataType === "image" || dataType === "depthmap") {
                return (
                    <ImageEditor
                        value={null}
                        onChange={(v) =>
                            onChange(
                                dataType === "image"
                                    ? { kind: "image", data: v }
                                    : {
                                          kind: "depthmap",
                                          values: Array.from(v.data).filter(
                                              (_, i) => i % 4 === 0,
                                          ),
                                          width: v.width,
                                          height: v.height,
                                      },
                            )
                        }
                    />
                )
            } else if (dataType === "waveform") {
                return (
                    <WaveformEditor
                        value={null}
                        onChange={(v) => onChange(cloneWaveform(v))}
                    />
                )
            }
        }
        // Otherwise, show a button to set the value to a default
        return (
            <button
                className={"add-data-btn" + (!optional ? " danger" : "")}
                title={
                    !optional
                        ? "This port requires a value"
                        : "Add constant " + dataType
                }
                onClick={() => onChange(defaultValue)}
            >
                {!optional ? "⚠️" : "+"}
            </button>
        )
    }

    return (
        <>
            <InnerEditor value={value} onChange={onChange} />
            {optional && (
                <button
                    className="delete-data-btn"
                    onClick={() => onChange(null)}
                >
                    &times;
                </button>
            )}
        </>
    )
}

export default React.memo(DataEditor)
