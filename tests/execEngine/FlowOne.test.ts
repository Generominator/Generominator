import { expect, test, vi } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import CreateCurves from "../../src/cards/createCurves"
import { RandomNumberCard } from "../../src/cards/randomNumberGenerator"
import { LocationFromCoordinatesCard } from "../../src/cards/locationFromCoordinates"
import { GetWeatherAtALocation } from "../../src/cards/getWeatherAtALocation"
import { Word2Vec } from "../../src/cards/wordToVec"

const mockWeatherResponse = {
    weather: [{ description: "clear sky" }],
    main: { temp: 295.15, humidity: 40 },
    wind: { speed: 3.5 },
}

test("Execution Engine Flow One", async () => {
    // Mock fetch implementation for weather API
    const realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input.toString()
            if (
                url.startsWith(
                    "https://api.openweathermap.org/data/2.5/weather?",
                )
            ) {
                return {
                    ok: true,
                    json: async () => mockWeatherResponse,
                } as Response
            }
            return realFetch(input, init)
        },
    )

    const graph = new ExecutionGraph()

    //const potID = graph.addNode(new Potentiometer())
    const randomID = graph.addNode(new RandomNumberCard(), 0, 0)
    const locationID = graph.addNode(new LocationFromCoordinatesCard(), 0, 0)
    const weatherID = graph.addNode(new GetWeatherAtALocation(), 0, 0)
    const word2vecID = graph.addNode(new Word2Vec(), 0, 0)
    const createCurvesID = graph.addNode(new CreateCurves(), 0, 0)

    //connect all of them
    //graph.connect(potID, 0, locationID, 0)
    graph.connect(randomID, 0, locationID, 0)
    graph.connect(randomID, 0, locationID, 1)
    graph.connect(locationID, 0, weatherID, 0)
    graph.connect(weatherID, 0, word2vecID, 0)
    graph.connect(word2vecID, 0, createCurvesID, 0)

    const result = await graph.run()

    // node_0: RandomNumberCard
    const randomResult = result.get(randomID)
    expect(randomResult).toBeDefined()
    expect(randomResult?.[0].kind).toBe("value")
    if (randomResult?.[0].kind === "value") {
        expect(typeof randomResult[0].value).toBe("number")
    }

    // node_1: LocationFromCoordinatesCard
    const locationResult = result.get(locationID)
    expect(locationResult).toBeDefined()
    expect(locationResult?.[0].kind).toBe("geolocation")
    if (locationResult?.[0].kind === "geolocation") {
        expect(typeof locationResult[0].longitude).toBe("number")
        expect(typeof locationResult[0].latitude).toBe("number")
        if (randomResult?.[0].kind === "value") {
            expect(locationResult[0].longitude).toBe(randomResult[0].value)
            expect(locationResult[0].latitude).toBe(randomResult[0].value)
        }
    }

    // node_2: GetWeatherAtALocation
    const weather = result.get(weatherID)
    expect(weather).toBeDefined()
    expect(weather?.[0].kind).toBe("text")
    if (weather?.[0].kind === "text") expect(weather[0].value).toBe("clear sky")
    expect(weather?.[1].kind).toBe("value")
    if (weather?.[1].kind === "value") expect(weather[1].value).toBe(295.15)
    expect(weather?.[2].kind).toBe("value")
    if (weather?.[2].kind === "value") expect(weather[2].value).toBe(3.5)
    expect(weather?.[3].kind).toBe("value")
    if (weather?.[3].kind === "value") expect(weather[3].value).toBe(40)

    // node_3: Word2Vec
    const word2vec = result.get(word2vecID)
    expect(word2vec).toBeDefined()
    expect(word2vec?.[0].kind).toBe("vectorfield")
    if (word2vec?.[0].kind === "vectorfield") {
        expect(Array.isArray(word2vec[0].vectors)).toBe(true)
        expect(word2vec[0].vectors.length).toBeGreaterThan(0)
        for (const v of word2vec[0].vectors) {
            expect(v.kind).toBe("vector")
            expect(Array.isArray(v.value.components)).toBe(true)
            expect(typeof v.value.components[0]).toBe("number")
        }
    }

    // node_4: CreateCurves
    const createCurves = result.get(createCurvesID)
    expect(createCurves).toBeDefined()
    expect(createCurves?.[0].kind).toBe("curve")
})
