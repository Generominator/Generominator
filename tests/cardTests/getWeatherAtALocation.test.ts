import { test, expect, vi } from "vitest"
import { GetWeatherAtALocation } from "../../src/cards/getWeatherAtALocation"
import { dt } from "../../src/cardBase/dataTypes"
import {
    GeolocationPort,
    TextPort,
    ValuePort,
} from "../../src/cardBase/ports/port"

const mockWeatherResponse = {
    weather: [{ description: "clear sky" }],
    main: { temp: 295.15, humidity: 40 },
    wind: { speed: 3.5 },
}

test("GetWeatherAtALocation returns expected weather data", async () => {
    // Mock fetch implementation
    globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
    })

    const card = new GetWeatherAtALocation()
    const input = dt.geolocation(10, 20)
    const result = await card.evaluate([input])

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].kind).toBe("text")
    if (result[0].kind === "text") expect(result[0].value).toBe("clear sky")
    expect(result[1].kind).toBe("value")
    if (result[1].kind === "value") expect(result[1].value).toBe(295.15)
    expect(result[2].kind).toBe("value")
    if (result[2].kind === "value") expect(result[2].value).toBe(3.5)
    expect(result[3].kind).toBe("value")
    if (result[3].kind === "value") expect(result[3].value).toBe(40)
})

test("GetWeatherAtALocation ports are correct", () => {
    const card = new GetWeatherAtALocation()
    expect(card.inputs.length).toBe(1)
    expect(card.inputs[0]).toBeInstanceOf(GeolocationPort)
    expect(card.outputs.length).toBe(4)
    expect(card.outputs[0]).toBeInstanceOf(TextPort)
    expect(card.outputs[0].label).toBe("weather description")
    expect(card.outputs[1]).toBeInstanceOf(ValuePort)
    expect(card.outputs[1].label).toBe("temperature")
    expect(card.outputs[2]).toBeInstanceOf(ValuePort)
    expect(card.outputs[2].label).toBe("wind speed")
    expect(card.outputs[3]).toBeInstanceOf(ValuePort)
    expect(card.outputs[3].label).toBe("humidity")
})
