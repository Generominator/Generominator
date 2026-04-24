import { Card } from "../cardBase/card"
import type { DataType, DataTypeOf } from "../cardBase/dataTypes"
import {
    GeolocationPort,
    TextPort,
    ValuePort,
    type Port,
} from "../cardBase/ports/port"
import { dt } from "../cardBase/dataTypes"

/**
 * Basic implementation of the 'get weather at a location' card.
 *
 * @remarks Right now the card evaluate function does not actually return anything.
 * @remarks This functionality uses the OpenWeather API
 *
 * @todo figure out in class how the evaluate function should handle fetching
 * @todo figure out exactly how card setup is intended to look
 * @todo figure out if we need to get a student API
 *
 * @see https://openweathermap.org/api
 *
 */
export class GetWeatherAtALocation extends Card {
    title: string = "get weather at a location"
    description?: string | undefined
    inputs: Port[]
    outputs: Port[]
    constructor() {
        super()
        this.inputs = [new GeolocationPort("", false, dt.geolocation(0, 0))]
        this.outputs = [
            new TextPort("weather description"),
            new ValuePort("temperature"),
            new ValuePort("wind speed"),
            new ValuePort("humidity"),
        ]
    }
    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        // TODO: throw error if input is not DataTypeOf<"geolocation">;
        const pos = inputs[0] as unknown as DataTypeOf<"geolocation">

        return getWeatherData(pos)
    }
    init(): void {}
    cleanup(): void {}
}

// init will start a fetch, evaluate can only start once all the inits are complete.

// take DataTypeOf<"geolocation"> and return a promise for weather description, temperature, speed, and humidity.
async function getWeatherData(
    pos: DataTypeOf<"geolocation">,
): Promise<DataType[]> {
    // get coordinates from DataTypeOf<"geolocation">
    // get Open Weather API key
    // get appropriate url
    const OPENWEATHER_KEY = "d169a0063990f639f197f1da4fd41316"
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.latitude}&lon=${pos.longitude}&appid=${OPENWEATHER_KEY}`

    // fetch data from url and return output data
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`)
        }

        const result = await response.json()
        // Port[] should be weather description, temperature, speed, and humidity.
        // TODO: decide on units of measurement
        const output = [
            dt.text(result.weather[0].description),
            dt.value(result.main.temp),
            dt.value(result.wind.speed),
            dt.value(result.main.humidity),
        ]

        return output
    } catch (error) {
        // TODO: type error
        console.error(error)
        return []
    }
}
