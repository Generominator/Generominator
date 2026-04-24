import { expect, test } from "vitest"
import { GenerateTextMarkov } from "../../src/cards/generateTextMarkov"

//for testing we need to reach in a bit. Might be useful to expose some of these functions later?
interface MarkovInternals {
    buildChain: (text: string) => void
    chain: Record<string, string[]>
    generate: (length?: number, seed?: string) => string
    init: () => void
}

test("Markov Card initializes the chain correctly with mocked corpus", async () => {
    const card = new GenerateTextMarkov()

    const testCorpus = "the cat sat on the mat the cat sat on the hat"
    ;(card as unknown as MarkovInternals).buildChain(testCorpus)

    const chain = (card as unknown as MarkovInternals).chain

    expect(chain["the cat"]).toContain("sat")
    expect(chain["sat on"]).toEqual(["the", "the"])
    expect(chain["on the"]).toContain("mat")
    expect(chain["on the"]).toContain("hat")
})

test("Markov Card generates text of the requested approximate length", async () => {
    const card = new GenerateTextMarkov()

    const results = await card.evaluate()
    const result = results[0]

    expect(result.kind).toBe("text")
    if (result.kind === "text") {
        expect(typeof result.value).toBe("string")
        expect(result.value.split(" ").length).toBeGreaterThan(40)
    }
}, 10000)

test("Markov Card handles dead ends by picking a new random state", async () => {
    const card = new GenerateTextMarkov()
    ;(card as unknown as MarkovInternals).buildChain("hello world end")

    const text = (card as unknown as MarkovInternals).generate(5)
    expect(text).toContain("hello world")
    expect(text.split(" ").length).toBeGreaterThan(2)
})

test("Markov Card can kinda accept initial state seeds", async () => {
    const card = new GenerateTextMarkov()

    ;(card as unknown as MarkovInternals).init()

    const text = (card as unknown as MarkovInternals).generate(50, "Turtle")
    expect(text.split(" ")[0]).toBe("Turtle’s")
    expect(text.split(" ").length).toBeGreaterThan(2)
}, 10000)
