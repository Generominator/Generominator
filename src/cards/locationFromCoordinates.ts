import { Card } from "../cardBase/card"
import type { DataType } from "../cardBase/dataTypes"
import { dt } from "../cardBase/dataTypes"
import { GeolocationPort, ValuePort, type Port } from "../cardBase/ports/port"

export class LocationFromCoordinatesCard extends Card {
    inputs: Port[]
    outputs: Port[]
    title: string = "Location from Coordinates"
    description: string = ""
    constructor() {
        super()
        this.inputs = [
            new ValuePort("longitude", false, dt.value(0)),
            new ValuePort("latitude", false, dt.value(0)),
        ]
        this.outputs = [new GeolocationPort("geolocation")]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        if (
            inputs.length !== 2 ||
            inputs[0].kind !== "value" ||
            inputs[1].kind !== "value"
        ) {
            throw new Error(
                `LocationFromCoordinatesCard expects two value inputs (longitude, latitude), got: ${JSON.stringify(inputs)}`,
            )
        }
        const longitude = inputs[0].value
        const latitude = inputs[1].value

        // Return as geolocation DataType
        return [dt.geolocation(longitude, latitude)]
    }
    init(): void {
        // No initialization needed for this card
    }
    cleanup(): void {
        // No cleanup needed for this card
    }
}
