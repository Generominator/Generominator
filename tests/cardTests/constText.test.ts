import { expect, test, vi } from "vitest"
import { ConstTextCard } from "../testingUtils/testingCards/constText.ts"

test("ConstTextCard updates value when setValue is called", async () => {
    const card = new ConstTextCard()
    card.setValue("Hello World!")
    const outputs = await card.evaluate()
    expect(outputs.length).toBe(1)
    const out = outputs[0]
    if (out.kind !== "text") throw new Error("Output is not text")
    expect(out.value).toBe("Hello World!")
})

test("ConstTextCard event callback is called on value change", () => {
    const card = new ConstTextCard()
    const callback = vi.fn()
    card.setEventCallback(callback)
    card.setValue("New Value")
    expect(callback).toHaveBeenCalled()
})

test("ConstTextCard event callback is not called if value is unchanged", () => {
    const card = new ConstTextCard()
    const callback = vi.fn()
    card.setEventCallback(callback)
    card.setValue("Change Me :)") // same as default
    expect(callback).not.toHaveBeenCalled()
})

test("ConstTextCard event callback fires correct number of times on rapid changes", () => {
    const card = new ConstTextCard()
    const callback = vi.fn()
    card.setEventCallback(callback)
    card.setValue("A")
    card.setValue("B")
    card.setValue("C")
    expect(callback).toHaveBeenCalledTimes(3)
})
