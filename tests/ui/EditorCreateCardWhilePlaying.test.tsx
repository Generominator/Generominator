// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, test, vi } from "vitest"

const testState = vi.hoisted(() => ({
    createdCard: null as null | object,
    initCallCount: 0,
}))

vi.mock("../../src/ui/Editor/Canvas/Canvas.tsx", () => ({
    default: function MockCanvas() {
        return <div id="mock-canvas" />
    },
}))

vi.mock("../../src/ui/Editor/Playback/Playback.tsx", () => ({
    default: function MockPlayback({
        onPlay = () => {},
    }: {
        onPlay?: () => void
    }) {
        return (
            <button id="mock-playback-button" onClick={onPlay}>
                Toggle Play
            </button>
        )
    },
}))

vi.mock("../../src/ui/Editor/CardBank/CardBank.tsx", async () => {
    const { EventEmittingTestCard } =
        await import("../testingUtils/testingCards/EventEmitting.ts")

    return {
        default: function MockCardBank({
            onCreate = () => {},
        }: {
            onCreate?: (
                card: InstanceType<typeof EventEmittingTestCard>,
                pos: [number, number],
                mousePos: [number, number],
            ) => void
        }) {
            return (
                <button
                    id="mock-add-card-button"
                    onClick={() => {
                        const card = new EventEmittingTestCard()
                        const originalInit = card.init.bind(card)
                        card.init = () => {
                            testState.initCallCount++
                            originalInit()
                        }
                        testState.createdCard = card
                        onCreate(card, [240, 120], [0, 0])
                    }}
                >
                    Add Card
                </button>
            )
        },
    }
})

import Editor from "../../src/ui/Editor/Editor.tsx"

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

test("CardBank cards added while playing are initialized", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
        root.render(<Editor />)
    })

    const playButton = container.querySelector(
        "#mock-playback-button",
    ) as HTMLButtonElement | null
    const addCardButton = container.querySelector(
        "#mock-add-card-button",
    ) as HTMLButtonElement | null

    expect(playButton).toBeTruthy()
    expect(addCardButton).toBeTruthy()

    await act(async () => {
        playButton?.click()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await act(async () => {
        addCardButton?.click()
    })

    expect(testState.createdCard).toBeTruthy()
    expect(testState.initCallCount).toBe(1)

    await act(async () => {
        root.unmount()
    })
    container.remove()
})
