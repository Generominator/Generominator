import { test, expect, vi } from "vitest"
import { Time } from "../../src/cards/time"

/**
 * checks that the time card returns a number and that the number it returns
 * is equal to today's date and time in milliseconds since the "epoch"
 */
test("Time returns current time", async () => {
    const card = new Time()
    const result = await card.evaluate()

    expect(result[0].kind).toBe("value")
    if (result[0].kind === "value")
        expect(result[0].value).closeTo(Date.now(), 500)
})

test("Time emits tick events", () => {
    vi.useFakeTimers()
    const card = new Time()
    const onEvent = vi.fn()

    card.setEventCallback(onEvent)
    card.init()

    vi.advanceTimersByTime(1000)
    expect(onEvent).toHaveBeenCalled()

    onEvent.mockClear()
    card.cleanup()
    vi.advanceTimersByTime(1000)
    expect(onEvent).not.toHaveBeenCalled()

    vi.useRealTimers()
})
