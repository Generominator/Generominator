import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { AndCard } from "../../src/cards/andCard"
import { CompareCard } from "../../src/cards/compareCard"
import { NotCard } from "../../src/cards/notCard"
import { OrCard } from "../../src/cards/orCard"
import { XorCard } from "../../src/cards/xorCard"

test("CompareCard outputs less/equal/greater states", async () => {
    const card = new CompareCard()

    const less = await card.evaluate([dt.value(1), dt.value(2)])
    expect(less).toEqual([dt.state(true), dt.state(false), dt.state(false)])

    const equal = await card.evaluate([dt.value(2), dt.value(2)])
    expect(equal).toEqual([dt.state(false), dt.state(true), dt.state(false)])

    const greater = await card.evaluate([dt.value(3), dt.value(2)])
    expect(greater).toEqual([dt.state(false), dt.state(false), dt.state(true)])
})

test("AndCard truth table", async () => {
    const card = new AndCard()
    expect(await card.evaluate([dt.state(false), dt.state(false)])).toEqual([
        dt.state(false),
    ])
    expect(await card.evaluate([dt.state(false), dt.state(true)])).toEqual([
        dt.state(false),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(false)])).toEqual([
        dt.state(false),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(true)])).toEqual([
        dt.state(true),
    ])
})

test("OrCard truth table", async () => {
    const card = new OrCard()
    expect(await card.evaluate([dt.state(false), dt.state(false)])).toEqual([
        dt.state(false),
    ])
    expect(await card.evaluate([dt.state(false), dt.state(true)])).toEqual([
        dt.state(true),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(false)])).toEqual([
        dt.state(true),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(true)])).toEqual([
        dt.state(true),
    ])
})

test("XorCard truth table", async () => {
    const card = new XorCard()
    expect(await card.evaluate([dt.state(false), dt.state(false)])).toEqual([
        dt.state(false),
    ])
    expect(await card.evaluate([dt.state(false), dt.state(true)])).toEqual([
        dt.state(true),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(false)])).toEqual([
        dt.state(true),
    ])
    expect(await card.evaluate([dt.state(true), dt.state(true)])).toEqual([
        dt.state(false),
    ])
})

test("NotCard inverts state", async () => {
    const card = new NotCard()
    expect(await card.evaluate([dt.state(false)])).toEqual([dt.state(true)])
    expect(await card.evaluate([dt.state(true)])).toEqual([dt.state(false)])
})
