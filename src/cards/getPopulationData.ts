import { Card } from "../cardBase/card"
import { dt, type DataType, type DataTypeOf } from "../cardBase/dataTypes"
import { GeolocationPort, Port, ValuePort } from "../cardBase/ports/port"

/**
 * Implements the Get Population Data card using the World Bank API + Nominatim API.
 *
 * @remarks I can not find any API that has an average age for country calculation, so I tried my best.
 * @remarks World Bank only has years up until 2024 (they're still doing 2025).
 *
 * @example https://api.worldbank.org/v2/country/gb/indicator/SP.POP.TOTL;NY.GDP.MKTP.CD;SP.DYN.LE00.IN;SP.POP.65UP.TO.ZS?date=2022&format=json&source=2
 *
 * @see https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation - no real
 * confining restrictions, only option for needed metrics but needs country codes (can't take longitude/latitude).
 * @see https://nominatim.org/release-docs/develop/api/Overview/ - open source option for reverse geocoding for country
 * codes, but has some key restrictions (e.g., 1 req/sec.)
 */
export class GetPopulationData extends Card {
    title = "Get Population Data"
    description = "Get population data from World Population API"

    inputs: Port[] = [
        new GeolocationPort("location", false, dt.geolocation(0, 0)),
        new ValuePort("year", false, dt.value(2020)),
    ]
    outputs: Port[] = [
        new ValuePort("population"),
        new ValuePort("GDP"),
        new ValuePort("life expectancy"),
        new ValuePort("average age"),
    ]

    // Cache to prevent redundant API calls
    private lastInputs: string = ""
    private cachedData: number[] = [0, 0, 0, 0]

    private async fetchCountryPopulationData(
        latitude: number,
        longitude: number,
        year: number,
    ): Promise<number[]> {
        try {
            // Convert latitude and longitude to country code
            const reverseGeoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                {
                    headers: {
                        "User-Agent": "Generominator",
                    },
                },
            )
            const reverseGeoData = await reverseGeoRes.json()
            const countryCode =
                reverseGeoData.address?.country_code?.toUpperCase()

            // Sometimes (a lot of times), Nominatim can fail
            if (!countryCode) return [0, 0, 0, 0]

            // World Bank indicators
            // SP.POP.TOTL: Population
            // NY.GDP.MKTP.CD: GDP (Current USD)
            // SP.DYN.LE00.IN: Life Expectancy
            // SP.POP.0014.TO.ZS: Population ages <= 14 (% of total population)
            // SP.POP.1564.TO.ZS: Population ages 15-64 (% of total population)
            // SP.POP.65UP.TO.ZS: Population ages 65 and above (% of total population)
            const indicators =
                "SP.POP.TOTL;NY.GDP.MKTP.CD;SP.DYN.LE00.IN;SP.POP.0014.TO.ZS;SP.POP.1564.TO.ZS;SP.POP.65UP.TO.ZS"
            const wbUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicators}?date=${year}&format=json&source=2`

            const wbRes = await fetch(wbUrl)
            const wbData = await wbRes.json()

            // [1] is the actual data points unless there was an error, safety check
            if (!wbData || wbData.length < 2) return [0, 0, 0, 0]

            const results = wbData[1]

            /** Grabs that specific value from the World Bank results. */
            const findVal = (id: string) => {
                const match = results.find(
                    (res: { indicator: { id: string } }) =>
                        res.indicator.id === id,
                )
                return match?.value || 0
            }

            const population = findVal("SP.POP.TOTL")
            const gdp = findVal("NY.GDP.MKTP.CD")
            const lifeExpectancy = findVal("SP.DYN.LE00.IN")
            const p014 = findVal("SP.POP.0014.TO.ZS")
            const p1564 = findVal("SP.POP.1564.TO.ZS")
            const p65plus = findVal("SP.POP.65UP.TO.ZS")

            // Calculate weighted average using midpoints (this is me making stuff up)
            const averageAge =
                (p014 * 7.5 +
                    p1564 * 40 +
                    p65plus * ((65 + lifeExpectancy) / 2)) /
                100

            return [population, gdp, lifeExpectancy, averageAge]
        } catch (error) {
            console.error("Error fetching population data:", error)
            return [0, 0, 0, 0]
        }
    }

    async evaluate(inputs: DataType[]): Promise<DataType[]> {
        const geoInput = inputs.find(
            (input): input is DataTypeOf<"geolocation"> =>
                input.kind === "geolocation",
        )
        const yearInput = inputs.find(
            (input): input is DataTypeOf<"value"> => input.kind === "value",
        )

        if (!geoInput || !yearInput) {
            return this.cachedData.map((val) => dt.value(val))
        }

        const currentInputs = `${geoInput.latitude},${geoInput.longitude},${yearInput.value}`

        // Try our best to cache (aka don't recompute for the same inputs if they didn't change)
        if (currentInputs !== this.lastInputs) {
            this.lastInputs = currentInputs
            this.cachedData = await this.fetchCountryPopulationData(
                geoInput.latitude,
                geoInput.longitude,
                Math.floor(yearInput.value),
            )
        }

        return this.cachedData.map((val) => dt.value(val))
    }

    init(): void {}
    cleanup(): void {}
}
