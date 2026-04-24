import { test, expect, vi, type Mock, beforeEach } from "vitest"
import { BlueskyFeedCard } from "../../src/cards/blueskyFeedCard"

// Local mock state for Jetstream
const jetstreamInstances: unknown[] = []
function resetJetstreamInstances() {
    jetstreamInstances.splice(0, jetstreamInstances.length)
}

vi.mock("@skyware/jetstream", () => {
    class MockJetstream {
        onCreate = vi.fn()
        start = vi.fn()
        close = vi.fn()

        constructor() {
            jetstreamInstances.push(this)
        }
    }
    return {
        Jetstream: MockJetstream,
    }
})

beforeEach(() => {
    resetJetstreamInstances()
    vi.clearAllMocks()
})

test("BlueskyFeedCard emits event and updates on matching post", async () => {
    const card = new BlueskyFeedCard()
    const callback = vi.fn()
    card.setEventCallback(callback)
    card.init()

    const [jetstreamInstance] = jetstreamInstances as Array<{
        onCreate: Mock
        start: () => void
        close: () => void
    }>

    // Simulate Jetstream event handler
    const onCreate = jetstreamInstance.onCreate
    // Find the handler registered for 'app.bsky.feed.post'
    expect(onCreate).toHaveBeenCalledWith(
        "app.bsky.feed.post",
        expect.any(Function),
    )
    const handler = onCreate.mock.calls[0][1]

    // Simulate a non-turtle post
    handler({ commit: { record: { text: "hello world" } } })
    expect(callback).not.toHaveBeenCalled()
    await expect(
        card.evaluate([{ kind: "text", value: "turtle" }]),
    ).resolves.toEqual([{ kind: "text", value: "No matching posts yet." }])

    // Simulate a turtle post
    handler({ commit: { record: { text: "I saw a turtle!" } } })
    expect(callback).toHaveBeenCalled()
    await expect(
        card.evaluate([{ kind: "text", value: "turtle" }]),
    ).resolves.toEqual([{ kind: "text", value: "I saw a turtle!" }])

    // Change the match string to 'cat' and check reset
    await expect(
        card.evaluate([{ kind: "text", value: "cat" }]),
    ).resolves.toEqual([{ kind: "text", value: "No matching posts yet." }])

    // Simulate a cat post
    handler({ commit: { record: { text: "A cat appeared!" } } })
    await expect(
        card.evaluate([{ kind: "text", value: "cat" }]),
    ).resolves.toEqual([{ kind: "text", value: "A cat appeared!" }])

    card.cleanup()
    expect(jetstreamInstance.close).toHaveBeenCalled()
})

test("BlueskyFeedCard shares Jetstream and closes on last cleanup", () => {
    const first = new BlueskyFeedCard()
    const second = new BlueskyFeedCard()

    first.init()
    second.init()

    const instances = jetstreamInstances as Array<{ close: () => void }>
    expect(instances).toHaveLength(1)

    const [jetstreamInstance] = instances
    const closeSpy = vi.spyOn(jetstreamInstance, "close")

    first.cleanup()
    expect(closeSpy).not.toHaveBeenCalled()

    second.cleanup()
    expect(closeSpy).toHaveBeenCalled()
})
