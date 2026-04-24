import { test, expect } from "vitest"
import { GetPopulationData } from "../../src/cards/getPopulationData"
import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"

test("GetPopulationData returns real data for a location", async () => {
    const card = new GetPopulationData()

    // London coordinates and the year 2020
    const inputs = [dt.geolocation(-0.1278, 51.5074), dt.value(2020)]

    const results = await card.evaluate(inputs)
    expect(results.length).toBe(4)

    // Check output types
    results.forEach((res) => {
        expect(res.kind).toBe("value")
    })

    const population = (results[0] as DataTypeOf<"value">).value
    const gdp = (results[1] as DataTypeOf<"value">).value
    const lifeExpectancy = (results[2] as DataTypeOf<"value">).value

    // Validation: Google tells me the population was 67.1 million
    expect(population).toBeGreaterThan(5000)
    expect(population).toBeLessThan(100000000)

    // The UK *should* have some bands
    expect(gdp).toBeGreaterThan(1000000000000)

    // And I presume life is good in the UK (ish)
    expect(lifeExpectancy).toBeGreaterThan(70)
    expect(lifeExpectancy).toBeLessThan(95)
})

test("GetPopulationData returns zeros/cache for missing inputs", async () => {
    const card = new GetPopulationData()

    // Evaluate with empty array
    const results = await card.evaluate([])

    expect(results.length).toBe(4)
    results.forEach((res) => {
        expect((res as DataTypeOf<"value">).value).toBe(0)
    })
})
