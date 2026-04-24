import { test, expect } from "vitest"
import { StockMarketData } from "../../src/cards/stockMarketData"

test("StockMarketData returns a number within an acceptable range", async () => {
    const card = new StockMarketData()

    // Wait for init() to complete the API fetch
    await card.init()

    const [cachedOutput] = await card.evaluate()

    if (cachedOutput.kind !== "value")
        throw new Error("Expected cachedOutput.kind === 'value'")

    const cachedPrice = cachedOutput.value

    // Check that we got a number
    expect(cachedPrice).toBeTypeOf("number")

    // Optional: check a realistic range for Apple stock
    expect(cachedPrice).toBeGreaterThan(100)
    expect(cachedPrice).toBeLessThan(500)
})
