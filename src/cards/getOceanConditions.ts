import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import {
    GeolocationPort,
    Port,
    ValuePort,
    VectorPort,
} from "../cardBase/ports/port"

/**
 * Implements the Get Ocean Conditions card. Uses open-source APIs (open-mateo) for global ocean
 * stats + wind stats.
 *
 * @remarks There's no free salinity calculation outside of NOAA.
 * @remarks NOAA's API is (1) U.S. restricted, and (2) requires station IDs as opposed
 * to direct latitude and longitude inputs.
 *
 * @todo Is it alright if I just give the values as vectors as is, or should I convert
 * them into Cartesian coordinates for better compatibility with other cards.
 *
 * @see https://github.com/open-meteo/open-meteo - repo
 * @see https://open-meteo.com/ - docs
 */
export class GetOceanConditions extends Card {
    title = "Get Ocean Conditions"
    description = "Get the ocean conditions from an API"

    inputs: Port[] = [
        new GeolocationPort("location", false, dt.geolocation(0, 0)),
    ]
    outputs: Port[] = [
        new VectorPort("current"),
        new VectorPort("wind"),
        // changed salinity -> wave height due to the data not being accessible
        new ValuePort("wave height"),
        new ValuePort("visibility"),
        new ValuePort("water temperature"),
    ]

    private lastInputs: DataTypeOf<"geolocation"> | null = null

    private cachedResults: DataType[] = [
        dt.vector([0, 0]),
        dt.vector([0, 0]),
        dt.value(0),
        dt.value(0),
        dt.value(0),
    ]

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        // Ensure there's a valid new input
        const geoInput = inputs.find(
            (input): input is DataTypeOf<"geolocation"> =>
                input.kind === "geolocation",
        )

        const longitude = geoInput?.longitude
        const latitude = geoInput?.latitude

        if (
            !geoInput ||
            (this.lastInputs?.latitude === latitude &&
                this.lastInputs?.longitude === longitude)
        ) {
            return this.cachedResults
        }

        this.lastInputs = geoInput

        const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=ocean_current_velocity,ocean_current_direction,sea_surface_temperature`
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,wind_direction_10m,visibility`

        const [marineResponse, weatherResponse] = await Promise.all([
            fetch(marineUrl).then((r) => r.json()),
            fetch(weatherUrl).then((r) => r.json()),
        ])

        // Combine current stuff into a vector
        const currentVelocity =
            marineResponse.current?.ocean_current_velocity ?? 0
        const currentDirection =
            marineResponse.current?.ocean_current_direction ?? 0
        const currentVector = dt.vector([currentVelocity, currentDirection])

        // Combine wind stuff into a vector
        const windSpeed = weatherResponse.current?.wind_speed_10m ?? 0
        const windDirection = weatherResponse.current?.wind_direction_10m
        const windVector = dt.vector([windSpeed, windDirection])

        // Grab visibility data from maring response
        const waveHeight = dt.value(marineResponse.current?.waveHeight ?? 0)

        // Grab visibility data from weather response
        const visibility = dt.value(weatherResponse.current?.visibility ?? 0)

        // Grab water temperature from marine response
        const waterTemp = dt.value(
            marineResponse.current?.sea_surface_temperature ?? 0,
        )

        return [currentVector, windVector, waveHeight, visibility, waterTemp]
    }

    init(): void {}
    cleanup(): void {}
}
