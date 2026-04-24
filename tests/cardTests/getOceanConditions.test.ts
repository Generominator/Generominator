import { test, expect, vi, beforeEach } from "vitest"
import { GetOceanConditions } from "../../src/cards/getOceanConditions"
import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"

// So nobody messes up the fetch spy
beforeEach(() => {
    vi.restoreAllMocks()
})

test("GetOceanConditions returns data for a valid ocean location", async () => {
    const card = new GetOceanConditions()
    // "Null island" in the Atlantic Ocean by Africa
    const input = [dt.geolocation(0, 0)]

    const result = await card.evaluate(input)

    expect(result.length).toBe(5)
    expect(result[0].kind).toBe("vector")
    expect(result[1].kind).toBe("vector")
    expect(result[2].kind).toBe("value")
    expect(result[3].kind).toBe("value")
    expect(result[4].kind).toBe("value")

    // Verify types
    const current = result[0] as DataTypeOf<"vector">
    const wind = result[1] as DataTypeOf<"vector">
    const waveHeight = result[2] as DataTypeOf<"value">
    const visibility = result[3] as DataTypeOf<"value">
    const waterTemp = result[4] as DataTypeOf<"value">

    // Basic formatting check
    expect(current.value.dimension).toBe(2)
    expect(wind.value.dimension).toBe(2)

    // I would be concerned for humanity if they're less than 0
    expect(waveHeight.value).toBeGreaterThanOrEqual(0)
    expect(visibility.value).toBeGreaterThanOrEqual(0)
    expect(waterTemp.value).toBeGreaterThanOrEqual(0)
}, 15000) // Big timeout as a buffer for api calls

test("GetOceanConditions uses cached data if coordinates haven't changed", async () => {
    const card = new GetOceanConditions()
    const input = [dt.geolocation(-5, -5)]
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    // First evaluate
    await card.evaluate(input)
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    // Second evaluate
    await card.evaluate(input)

    // Total calls should still be 2
    expect(fetchSpy).toHaveBeenCalledTimes(2)
})
