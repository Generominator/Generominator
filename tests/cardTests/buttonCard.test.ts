import { test, expect, vi } from "vitest"
import { buttonCard } from "../../src/cards/buttonCard"
import type { DataTypeOf } from "../../src/cardBase/dataTypes"

test("buttonCard initial state is false", async () => {
    const card = new buttonCard()
    const result = await card.evaluate()
    expect(result[0].kind).toBe("state")
    const out = result[0] as DataTypeOf<"state">
    expect(out.value).toBe(false)
})

test("buttonCard setValue(true) updates state and triggers event", async () => {
    const card = new buttonCard()
    const onEvent = vi.fn()
    card.setEventCallback(onEvent)
    card.setValue(true)
    expect(card.cardState).toBe(true)
    expect(onEvent).toHaveBeenCalled()
    const result = await card.evaluate()
    const out = result[0] as DataTypeOf<"state">
    expect(out.value).toBe(true)
})
