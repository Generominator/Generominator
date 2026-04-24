import { test, expect } from "vitest"
import { Word2Vec } from "../../src/cards/wordToVec"
import { dt, type DataTypeOf } from "../../src/cardBase/dataTypes"
import { TextPort, VectorFieldPort } from "../../src/cardBase/ports/port"

test("Word2Vec card ports are correct", () => {
    const card = new Word2Vec()
    expect(card.inputs.length).toBe(1)
    expect(card.inputs[0]).toBeInstanceOf(TextPort)
    expect(card.inputs[0].label).toBe("text")
    expect(card.outputs.length).toBe(1)
    expect(card.outputs[0]).toBeInstanceOf(VectorFieldPort)
    expect(card.outputs[0].label).toBe("representative vector")
})

test("Word2Vec returns vectorfield for text input (real model)", async () => {
    const card = new Word2Vec()
    const input = dt.text("hello world")
    const result = await card.evaluate([input])
    expect(result[0].kind).toBe("vectorfield")
    if (result[0].kind === "vectorfield") {
        const out = result[0] as DataTypeOf<"vectorfield">
        expect(out.vectors.length).toBe(2) // 'hello' and 'world'
        for (const v of out.vectors) {
            expect(Array.isArray(v.value.components)).toBe(true)
            expect(typeof v.value.components[0]).toBe("number")
            expect(v.value.components.length).toBeGreaterThan(0)
        }
    } else {
        throw new Error("Expected vectorfield")
    }
})

test("Word2Vec returns empty vectorfield for empty input", async () => {
    const card = new Word2Vec()
    const input = dt.text("   ")
    const result = await card.evaluate([input])
    if (result[0].kind === "vectorfield") {
        const out = result[0] as DataTypeOf<"vectorfield">
        expect(out.vectors.length).toBe(0)
    } else {
        throw new Error("Expected vectorfield")
    }
})
