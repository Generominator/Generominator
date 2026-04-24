import { test, expect } from "vitest"
import { SentimentAnalysis } from "../../src/cards/sentimentAnalysis"
import { dt } from "../../src/cardBase/dataTypes"

test("SentimentAnalysis returns a valid value", async () => {
    const sentiment = new SentimentAnalysis()
    const input = dt.text(
        "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way–in short, the period was so far like the present period that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.",
    )
    const result = await sentiment.evaluate([input])

    expect(result[0].kind).toBe("value")

    if (!("value" in result[0])) {
        throw new Error("value not found in result.")
    }
    expect(result[0].value).toBeCloseTo(0.59, 1)
})
