import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { GeolocationPort, type Port } from "../cardBase/ports/port"

/* get location of user using browser geolocation API */
export class SatelliteLocation extends Card {
    title = "Get User Location"
    description = "Get the user's current latitude and longitude"

    inputs: Port[] = []
    outputs: Port[] = [new GeolocationPort("location")]

    // Null until we have receive geolocation from user's browser
    private cachedLocation: DataTypeOf<"geolocation"> | null = null
    private isLocating = false
    // Resolve hook used by requestLocation() when the browser returns a location.
    private pendingLocationResolve:
        | ((location: DataTypeOf<"geolocation">) => void)
        | null = null

    //promise evalute to wait for cashed location
    evaluate(): Promise<DataType[]> {
        if (this.cachedLocation) {
            return Promise.resolve([this.cachedLocation])
        }

        this.requestLocation()
        // Create a pending promise until location is available.
        return new Promise((resolve) => {
            this.pendingLocationResolve = (location) => {
                this.pendingLocationResolve = null
                resolve([location])
            }
        })
    }

    //request location when initiated
    init(): void {
        this.requestLocation()
    }

    cleanup(): void {}

    //handling of request
    private requestLocation(): void {
        if (this.isLocating) return

        this.isLocating = true
        //check if geolocation can be grabed
        if (!navigator.geolocation) {
            console.error("Geolocation not supported by browser")
            return
        }

        //grab geolocation
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                const location = dt.geolocation(longitude, latitude)
                this.cachedLocation = location
                // Wake any evaluate() callers waiting for a real location.
                this.pendingLocationResolve?.(location)
                this.pendingLocationResolve = null
                this.isLocating = false
            },
            (error) => {
                console.error("Geolocation error:", error.message)
                this.pendingLocationResolve = null
                this.isLocating = false
            },
        )
    }
}
