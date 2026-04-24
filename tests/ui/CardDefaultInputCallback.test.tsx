// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, test, vi } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import Card from "../../src/ui/lib/Card/Card"
import { Sum } from "../testingUtils/testingCards/Sum"

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

test("Card input editor uses the latest onDefaultInputChange callback", async () => {
    const card = new Sum()
    const defaultInputs = [dt.value(1), dt.value(0)]
    const callbackA = vi.fn()
    const callbackB = vi.fn()

    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
        root.render(
            <Card
                card={card}
                defaultInputs={defaultInputs}
                onDefaultInputChange={callbackA}
            />,
        )
    })

    await act(async () => {
        root.render(
            <Card
                card={card}
                defaultInputs={defaultInputs}
                onDefaultInputChange={callbackB}
            />,
        )
    })

    const input = container.querySelector(
        "input[type='number']",
    ) as HTMLInputElement | null
    expect(input).toBeTruthy()

    await act(async () => {
        if (!input) return
        input.value = "2"
        input.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(callbackA).not.toHaveBeenCalled()
    expect(callbackB).toHaveBeenCalled()
    const [portIndex, value] = callbackB.mock.calls.at(-1) ?? []
    expect(portIndex).toBe(0)
    expect(value).toEqual(dt.value(2))

    await act(async () => {
        root.unmount()
    })
    container.remove()
})
