import { test, expect, vi } from "vitest"
import { MouseCard } from "../../src/cards/mouseCard"
import type { DataTypeOf } from "../../src/cardBase/dataTypes"
import { ExecutionGraph } from "../../src/execEngine"
import { DebugCounter } from "../testingUtils/testingCards/DebugCounter"

// Hello, Node? Yes, you have a mouse now
class MockMouseEvent {
    clientX: number
    clientY: number
    button: number
    constructor(_type: string, opts: MouseEventInit = {}) {
        this.clientX = opts.clientX || 0
        this.clientY = opts.clientY || 0
        this.button = opts.button || 0
    }
}

function waitForNextResults(graph: ExecutionGraph): Promise<void> {
    return new Promise((resolve) => {
        const unsubscribe = graph.subscribeToResults(() => {
            unsubscribe()
            resolve()
        })
    })
}

test("MouseCard initial state", async () => {
    const card = new MouseCard()
    const result = await card.evaluate()
    expect(result[0].kind).toBe("vector")
    expect((result[0] as DataTypeOf<"vector">).value.components).toEqual([0, 0])
    expect(result[1].kind).toBe("state")
    expect((result[1] as DataTypeOf<"state">).value).toBe(false)
    expect(result[2].kind).toBe("state")
    expect((result[2] as DataTypeOf<"state">).value).toBe(false)
    expect(result[3].kind).toBe("event")
})

test("MouseCard updates pointer position on mousemove", async () => {
    const card = new MouseCard()

    // Directly call the handler
    card["handleMove"](
        new MockMouseEvent("mousemove", {
            clientX: 42,
            clientY: 99,
        }) as unknown as MouseEvent,
    )
    const result = await card.evaluate()
    expect((result[0] as DataTypeOf<"vector">).value.components).toEqual([
        42, 99,
    ])
})

test("MouseCard updates left and right button states", async () => {
    const card = new MouseCard()
    // Left button down
    card["handleDown"](
        new MockMouseEvent("mousedown", { button: 0 }) as unknown as MouseEvent,
    )
    let result = await card.evaluate()
    expect((result[1] as DataTypeOf<"state">).value).toBe(true)
    // Right button down
    card["handleDown"](
        new MockMouseEvent("mousedown", { button: 2 }) as unknown as MouseEvent,
    )
    result = await card.evaluate()
    expect((result[2] as DataTypeOf<"state">).value).toBe(true)
    // Left button up
    card["handleUp"](
        new MockMouseEvent("mouseup", { button: 0 }) as unknown as MouseEvent,
    )
    result = await card.evaluate()
    expect((result[1] as DataTypeOf<"state">).value).toBe(false)
    // Right button up
    card["handleUp"](
        new MockMouseEvent("mouseup", { button: 2 }) as unknown as MouseEvent,
    )
    result = await card.evaluate()
    expect((result[2] as DataTypeOf<"state">).value).toBe(false)
})

test("MouseCard event callback reports only changed output ports", () => {
    const card = new MouseCard()
    const cb = vi.fn()
    card.setEventCallback(cb)

    card["handleMove"](
        new MockMouseEvent("mousemove", {
            clientX: 42,
            clientY: 99,
        }) as unknown as MouseEvent,
    )
    expect(cb).toHaveBeenLastCalledWith([0])

    card["handleDown"](
        new MockMouseEvent("mousedown", { button: 0 }) as unknown as MouseEvent,
    )
    expect(cb).toHaveBeenLastCalledWith([1, 3])

    card["handleDown"](
        new MockMouseEvent("mousedown", { button: 2 }) as unknown as MouseEvent,
    )
    expect(cb).toHaveBeenLastCalledWith([2])
})

test("MouseCard movement does not re-evaluate event-only downstream branch", async () => {
    const graph = new ExecutionGraph()
    const mouse = new MouseCard()
    const vectorSink = new DebugCounter()
    const eventSink = new DebugCounter()

    const mouseId = graph.addNode(mouse, 0, 0)
    const vectorSinkId = graph.addNode(vectorSink, 0, 0)
    const eventSinkId = graph.addNode(eventSink, 0, 0)

    graph.connect(mouseId, 0, vectorSinkId, 0)
    graph.connect(mouseId, 3, eventSinkId, 0)

    await graph.run()
    expect(vectorSink.evaluateCount).toBe(1)
    expect(eventSink.evaluateCount).toBe(1)

    const moveUpdate = waitForNextResults(graph)
    mouse["handleMove"](
        new MockMouseEvent("mousemove", {
            clientX: 7,
            clientY: 11,
        }) as unknown as MouseEvent,
    )
    await moveUpdate

    expect(vectorSink.evaluateCount).toBe(2)
    expect(eventSink.evaluateCount).toBe(1)

    const downUpdate = waitForNextResults(graph)
    mouse["handleDown"](
        new MockMouseEvent("mousedown", { button: 0 }) as unknown as MouseEvent,
    )
    await downUpdate

    expect(vectorSink.evaluateCount).toBe(2)
    expect(eventSink.evaluateCount).toBe(2)

    graph.dispose()
})
