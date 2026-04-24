import { test, expect } from "vitest"
import { Text } from "../../src/cards/text"

test("Text card returns requested text", async () => {
    const card = new Text()
    const result = await card.evaluate()

    expect(result[0].kind).toBe("text")
    if (result[0].kind === "text")
        expect(result[0].value).toEqual(card.options[card.selected])
})
