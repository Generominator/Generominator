import { expect, test } from "vitest"
import { GenerateTextGrammarCard } from "../../src/cards/generateTextGrammar"
import { type DataTypeOf } from "../../src/cardBase/dataTypes"
import { TextPort } from "../../src/cardBase/ports/port"

test("GenerateTextGrammarCard returns a text DataType", async () => {
    const card = new GenerateTextGrammarCard()

    const outputs = await card.evaluate()
    expect(outputs).toBeDefined()

    // There should be exactly one output for this card
    expect(outputs.length).toBe(1)

    const out = outputs[0] as DataTypeOf<"text">

    // Ensure the port type is 'text'
    expect(out.kind).toBe("text")

    // Ensure the value is a non-empty string
    expect(typeof out.value).toBe("string")
    expect(out.value.length).toBeGreaterThan(0)
})

test("consecutive evaluates produce different strings most of the time", async () => {
    const card = new GenerateTextGrammarCard()

    const runs = 4
    const results: string[] = []
    for (let i = 0; i < runs; i++) {
        const out = (await card.evaluate())[0] as DataTypeOf<"text">
        results.push(out.value)
    }

    // Ensure all results are strings
    for (const r of results) expect(typeof r).toBe("string")

    const unique = new Set(results)
    // Expect some variability; at least two distinct outputs
    expect(unique.size).toBeGreaterThan(1)
})

test("GenerateTextGrammarCard ports are correct", () => {
    const card = new GenerateTextGrammarCard()
    expect(card.inputs.length).toBe(0)
    expect(card.outputs.length).toBe(1)
    expect(card.outputs[0]).toBeInstanceOf(TextPort)
    expect(card.outputs[0].label).toBe("output")
})
