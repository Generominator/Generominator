import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { buttonCard } from "../../src/cards/buttonCard"
import { StateMemoryCard } from "../../src/cards/stateMemoryCard"
import { ExecutionGraph } from "../../src/execEngine"
import { CountingSinkCard } from "../testingUtils/CountingSinkCard"

test("Button-driven StateMemoryCard toggles once per press", async () => {
    const graph = new ExecutionGraph()

    const button = new buttonCard()
    const buttonNode = graph.addNode(button, 0, 0)
    button.setEventCallback(null)
    const memoryNode = graph.addNode(new StateMemoryCard(), 0, 0)

    // Button drives only the toggle input.
    graph.connect(buttonNode, 0, memoryNode, 2)

    const initial = await graph.run()
    expect(initial.get(memoryNode)?.[0]).toEqual(dt.state(false))

    button.setValue(true)
    const press1 = await graph.run()
    expect(press1.get(memoryNode)?.[0]).toEqual(dt.state(true))

    // Still pressed; additional runs should not retrigger.
    const held = await graph.run()
    expect(held.get(memoryNode)?.[0]).toEqual(dt.state(true))

    button.setValue(false)
    const release1 = await graph.run()
    expect(release1.get(memoryNode)?.[0]).toEqual(dt.state(true))

    button.setValue(true)
    const press2 = await graph.run()
    expect(press2.get(memoryNode)?.[0]).toEqual(dt.state(false))
})

test("StateMemoryCard keeps output stable on button release", async () => {
    const graph = new ExecutionGraph()

    const button = new buttonCard()
    const buttonNode = graph.addNode(button, 0, 0)
    button.setEventCallback(null)
    const memoryNode = graph.addNode(new StateMemoryCard(), 0, 0)
    const sink = new CountingSinkCard()
    const sinkNode = graph.addNode(sink, 0, 0)

    graph.connect(buttonNode, 0, memoryNode, 2)
    graph.connect(memoryNode, 0, sinkNode, 0)

    await graph.run()
    expect(sink.evaluateCount).toBe(1)

    button.setValue(true)
    const press = await graph.run()
    expect(press.get(memoryNode)?.[0]).toEqual(dt.state(true))
    expect(sink.evaluateCount).toBe(2)

    button.setValue(false)
    const release = await graph.run()
    expect(release.get(memoryNode)?.[0]).toEqual(dt.state(true))
    expect(sink.evaluateCount).toBe(3)
    expect(release.has(sinkNode)).toBe(true)
})

test("Button events toggle StateMemoryCard once per press in event-driven mode", async () => {
    const graph = new ExecutionGraph()

    const button = new buttonCard()
    const buttonNode = graph.addNode(button, 0, 0)
    const memoryNode = graph.addNode(new StateMemoryCard(), 0, 0)
    graph.connect(buttonNode, 0, memoryNode, 2)

    await graph.run()

    function waitForNextResults() {
        return new Promise<Map<string, ReturnType<typeof dt.state>[]>>(
            (resolve) => {
                const unsubscribe = graph.subscribeToResults((results) => {
                    unsubscribe()
                    resolve(
                        results as Map<string, ReturnType<typeof dt.state>[]>,
                    )
                })
            },
        )
    }

    let next = waitForNextResults()
    button.setValue(true)
    let results = await next
    expect(results.get(memoryNode)?.[0]).toEqual(dt.state(true))

    next = waitForNextResults()
    button.setValue(false)
    results = await next
    expect(results.get(memoryNode)?.[0]).toEqual(dt.state(true))

    next = waitForNextResults()
    button.setValue(true)
    results = await next
    expect(results.get(memoryNode)?.[0]).toEqual(dt.state(false))
})
