import { test, expect } from "vitest"
import { MakeVector } from "../../src/cards/makeVector"
import { dt } from "../../src/cardBase/dataTypes"

test("Can make a vector from 3 values", async () => {
    const values = [dt.value(1), dt.value(2), dt.value(3)]

    const card = new MakeVector()
    const results = await card.evaluate(values)

    expect(results[0].kind).toBe("vector")
})
