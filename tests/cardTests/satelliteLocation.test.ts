import { test, expect, afterEach, vi } from "vitest"
import { SatelliteLocation } from "../../src/cards/satelliteLocation"

afterEach(() => {
    vi.unstubAllGlobals()
})

//test if the geolocation is correct

test("returns a valid set of coordinates", async () => {
    vi.stubGlobal("navigator", {
        geolocation: {
            getCurrentPosition: vi.fn((success) => {
                success({
                    coords: {
                        latitude: 12.345,
                        longitude: 67.89,
                    },
                })
            }),
        },
    })

    const card = new SatelliteLocation()
    card.init()

    await new Promise((r) => setTimeout(r, 0))

    const [output] = await card.evaluate()

    expect(output.kind).toBe("geolocation")
    if (output.kind !== "geolocation") throw new Error("Expected geolocation")

    expect(typeof output.latitude).toBe("number")
    expect(typeof output.longitude).toBe("number")

    // Optional sanity bounds (still location-agnostic)
    expect(output.latitude).toBeGreaterThanOrEqual(-90)
    expect(output.latitude).toBeLessThanOrEqual(90)
    expect(output.longitude).toBeGreaterThanOrEqual(-180)
    expect(output.longitude).toBeLessThanOrEqual(180)
})

//test if geolocation throws error on failure

test("does not resolve on geolocation error", async () => {
    const getCurrentPosition = vi.fn((_success, error) => {
        error({})
    })
    vi.stubGlobal("navigator", {
        geolocation: {
            getCurrentPosition,
        },
    })

    const card = new SatelliteLocation()
    const evaluation = card.evaluate()

    const result = await Promise.race([
        evaluation.then(() => "resolved"),
        new Promise<string>((resolve) =>
            setTimeout(() => resolve("timeout"), 10),
        ),
    ])

    expect(getCurrentPosition).toHaveBeenCalled()
    expect(result).toBe("timeout")
})
