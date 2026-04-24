import { RandomNumberCard } from "../../src/cards/randomNumberGenerator"
import { expect, test } from "vitest"
import type { DataTypeOf } from "../../src/cardBase/dataTypes"

test("RandomNumberCard returns a value DataType in [0,1)", async () => {
    const card = new RandomNumberCard()

    const outputs = await card.evaluate()
    expect(outputs).toBeDefined()

    // There should be exactly one output for this card
    expect(outputs.length).toBe(1)

    const out = outputs[0] as DataTypeOf<"value">

    //Ensure the port type is 'value'
    expect(out.kind).toBe("value")

    // Ensure the value is a number in [0,1)
    const v = out.value
    expect(typeof v).toBe("number")
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(1)
})

test("consecutive evaluates produce different values most of the time", async () => {
    const card = new RandomNumberCard()
    const a = (await card.evaluate())[0] as DataTypeOf<"value">
    const b = (await card.evaluate())[0] as DataTypeOf<"value">
    const c = (await card.evaluate())[0] as DataTypeOf<"value">
    const d = (await card.evaluate())[0] as DataTypeOf<"value">
    expect(a.kind).toBe("value")
    expect(b.kind).toBe("value")
    expect(c.kind).toBe("value")
    expect(d.kind).toBe("value")

    expect(typeof a.value).toBe("number")
    expect(typeof b.value).toBe("number")
    expect(typeof c.value).toBe("number")
    expect(typeof d.value).toBe("number")

    expect(a.value).toBeGreaterThanOrEqual(0)
    expect(a.value).toBeLessThan(1)
    expect(b.value).toBeGreaterThanOrEqual(0)
    expect(b.value).toBeLessThan(1)
    expect(c.value).toBeGreaterThanOrEqual(0)
    expect(c.value).toBeLessThan(1)
    expect(d.value).toBeGreaterThanOrEqual(0)
    expect(d.value).toBeLessThan(1)

    //Ensure at least two values are different
    const values = [a.value, b.value, c.value, d.value]
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBeGreaterThan(1)
})
