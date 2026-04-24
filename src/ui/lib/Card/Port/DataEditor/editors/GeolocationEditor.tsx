import React from "react"
import "../dataEditor.css"

function GeolocationEditor({
    value,
    onChange = () => {},
}: {
    value: { longitude: number; latitude: number }
    onChange: (newValue: { longitude: number; latitude: number }) => void
}) {
    const [loading, setLoading] = React.useState(false)
    function update(type: "longitude" | "latitude", newValue: number) {
        value[type] = newValue
        onChange({ ...value })
    }

    async function useCurrentLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            return
        }
        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLoading(false)
                onChange({
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                })
            },
            (error) => {
                setLoading(false)
                alert("Unable to retrieve your location: " + error.message)
            },
        )
    }

    return (
        <>
            <input
                className="value-input"
                type="number"
                value={value.longitude}
                onChange={(e) =>
                    update("longitude", parseFloat(e.target.value))
                }
            />
            <input
                className="value-input"
                type="number"
                value={value.latitude}
                onChange={(e) => update("latitude", parseFloat(e.target.value))}
            />
            <button disabled={loading} onClick={useCurrentLocation}>
                {loading ? "Loading..." : "Use current location"}
            </button>
        </>
    )
}

export default GeolocationEditor
