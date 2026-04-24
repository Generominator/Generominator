import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { StateMemoryCard } from "../../src/cards/stateMemoryCard"

test("StateMemoryCard starts false and responds to set/reset", async () => {
    const card = new StateMemoryCard()

    const initial = await card.evaluate([
        dt.state(false),
        dt.state(false),
        dt.state(false),
    ])
    expect(initial).toEqual([dt.state(false)])

    const set = await card.evaluate([
        dt.state(true),
        dt.state(false),
        dt.state(false),
    ])
    expect(set).toEqual([dt.state(true)])

    const reset = await card.evaluate([
        dt.state(false),
        dt.state(true),
        dt.state(false),
    ])
    expect(reset).toEqual([dt.state(false)])
})

test("StateMemoryCard toggle input is rising-edge triggered", async () => {
    const card = new StateMemoryCard()

    await card.evaluate([dt.state(false), dt.state(false), dt.state(false)])

    const rise1 = await card.evaluate([
        dt.state(false),
        dt.state(false),
        dt.state(true),
    ])
    expect(rise1).toEqual([dt.state(true)])

    const held = await card.evaluate([
        dt.state(false),
        dt.state(false),
        dt.state(true),
    ])
    expect(held).toEqual([dt.state(true)])

    const fall = await card.evaluate([
        dt.state(false),
        dt.state(false),
        dt.state(false),
    ])
    expect(fall).toEqual([dt.state(true)])

    const rise2 = await card.evaluate([
        dt.state(false),
        dt.state(false),
        dt.state(true),
    ])
    expect(rise2).toEqual([dt.state(false)])
})

test("StateMemoryCard reset has priority over set/toggle", async () => {
    const card = new StateMemoryCard()
    await card.evaluate([dt.state(true), dt.state(false), dt.state(false)])

    const both = await card.evaluate([
        dt.state(true),
        dt.state(true),
        dt.state(true),
    ])
    expect(both).toEqual([dt.state(false)])
})
