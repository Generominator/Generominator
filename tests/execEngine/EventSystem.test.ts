import { expect, test, vi } from "vitest"
import { ExecutionGraph } from "../../src/execEngine"
import { isEventEmitting } from "../../src/cardBase/card"
import { EventEmittingTestCard } from "../testingUtils/testingCards/EventEmitting"
import { EventEmittingWithInput } from "../testingUtils/testingCards/EventEmittingWithInput"
import { Increment } from "../testingUtils/testingCards/Increment"
import { Sum } from "../testingUtils/testingCards/Sum"
import { FailingCard } from "../testingUtils/testingCards/Fail"
import { Slow } from "../testingUtils/testingCards/Slow"
import { dt } from "../../src/cardBase/dataTypes"

////**** Test cards ****////

test("isEventEmitting type guard works correctly", () => {
    const eventCard = new EventEmittingTestCard()
    const regularCard = new Increment()

    expect(isEventEmitting(eventCard)).toBe(true)
    expect(isEventEmitting(regularCard)).toBe(false)
})

test("Events trigger the callback", () => {
    const card = new EventEmittingTestCard()
    const callback = vi.fn()

    card.setEventCallback(callback)
    card.triggerEvent()

    expect(callback).toHaveBeenCalledTimes(1)
})

test("ExecutionGraph subscribes to card events", async () => {
    const graph = new ExecutionGraph()
    const eventCard = new EventEmittingTestCard()

    const eventNodeId = graph.addNode(eventCard, 0, 0)
    const incrementID = graph.addNode(new Increment(), 0, 0)
    graph.connect(eventNodeId, 0, incrementID, 0)

    const eventHandler = vi.fn()

    graph.subscribeToEvents(eventHandler)
    await graph.run()
    eventCard.triggerEvent()

    graph.dispose()
})

test("runFromNode uses cached values for upstream nodes", async () => {
    const graph = new ExecutionGraph()

    const upstream = new Increment()
    const eventCard = new EventEmittingWithInput()
    const downstream = new Increment()
    const sink = new Increment()

    const upstreamId = graph.addNode(upstream, 0, 0)
    const eventId = graph.addNode(eventCard, 0, 0)
    const downstreamId = graph.addNode(downstream, 0, 0)
    const sinkId = graph.addNode(sink, 0, 0)

    graph.connect(upstreamId, 0, sinkId, 0)
    graph.connect(sinkId, 0, eventId, 0)
    graph.connect(eventId, 0, downstreamId, 0)

    // Initial run
    await graph.run()
    expect(upstream.evaluateCount).toBe(1)
    expect(downstream.evaluateCount).toBe(1)

    // Simulate an event on the event card
    eventCard.triggerEvent()
    // Wait for the automatic run to complete
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(upstream.evaluateCount).toBe(1) // Still 1
    expect(downstream.evaluateCount).toBe(2) // Re-evaluated

    graph.dispose()
})

test("Event subscription can be unsubscribed", () => {
    const graph = new ExecutionGraph()
    const eventCard = new EventEmittingTestCard()

    graph.addNode(eventCard, 0, 0)

    const callback = vi.fn()
    const unsubscribe = graph.subscribeToEvents(callback)

    eventCard.triggerEvent()
    expect(callback).toHaveBeenCalledTimes(1)

    unsubscribe()

    eventCard.triggerEvent()
    expect(callback).toHaveBeenCalledTimes(1) // Still 1

    graph.dispose()
})

test("dispose cleans up event callbacks", () => {
    const graph = new ExecutionGraph()
    const eventCard = new EventEmittingTestCard()

    graph.addNode(eventCard, 0, 0)

    const callback = vi.fn()
    graph.subscribeToEvents(callback)

    graph.dispose()

    // events should not trigger callbacks after disposal
    eventCard.triggerEvent()
    expect(callback).toHaveBeenCalledTimes(0)
})

test("Long chain with event card in middle uses cached upstream values and does not re-evaluate them", async () => {
    const graph = new ExecutionGraph()

    // Create a long chain: source -> p1 -> p2 -> p3 -> eventCard -> p4 -> p5 -> p6
    // The event card is in the middle and takes input from upstream

    const source = new EventEmittingTestCard() // Starts at 0
    const p1 = new Increment() // +100
    const p2 = new Increment() // +100
    const p3 = new Increment() // +100
    const eventCard = new EventEmittingWithInput() // +internal value
    const p4 = new Increment() // +100
    const p5 = new Increment() // +100
    const p6 = new Increment() // +100

    const sourceId = graph.addNode(source, 0, 0)
    const p1Id = graph.addNode(p1, 0, 0)
    const p2Id = graph.addNode(p2, 0, 0)
    const p3Id = graph.addNode(p3, 0, 0)
    const eventId = graph.addNode(eventCard, 0, 0)
    const p4Id = graph.addNode(p4, 0, 0)
    const p5Id = graph.addNode(p5, 0, 0)
    const p6Id = graph.addNode(p6, 0, 0)

    graph.connect(sourceId, 0, p1Id, 0)
    graph.connect(p1Id, 0, p2Id, 0)
    graph.connect(p2Id, 0, p3Id, 0)
    graph.connect(p3Id, 0, eventId, 0)
    graph.connect(eventId, 0, p4Id, 0)
    graph.connect(p4Id, 0, p5Id, 0)
    graph.connect(p5Id, 0, p6Id, 0)

    // Initial run
    // source=0 -> p1=100 -> p2=200 -> p3=300 -> eventCard=300+0=300 -> p4=400 -> p5=500 -> p6=600
    const result1 = await graph.run()

    expect(result1.get(sourceId)?.[0]).toEqual(dt.value(0))
    expect(result1.get(p1Id)?.[0]).toEqual(dt.value(100))
    expect(result1.get(p2Id)?.[0]).toEqual(dt.value(200))
    expect(result1.get(p3Id)?.[0]).toEqual(dt.value(300))
    expect(result1.get(eventId)?.[0]).toEqual(dt.value(300))
    expect(result1.get(p4Id)?.[0]).toEqual(dt.value(400))
    expect(result1.get(p5Id)?.[0]).toEqual(dt.value(500))
    expect(result1.get(p6Id)?.[0]).toEqual(dt.value(600))

    // All cards evaluated once
    expect(p1.evaluateCount).toBe(1)
    expect(p2.evaluateCount).toBe(1)
    expect(p3.evaluateCount).toBe(1)
    expect(eventCard.evaluateCount).toBe(1)
    expect(p4.evaluateCount).toBe(1)
    expect(p5.evaluateCount).toBe(1)
    expect(p6.evaluateCount).toBe(1)

    // Trigger event on the middle card (adds 1000 to internal value)
    eventCard.triggerEvent()
    // Wait for the automatic run to complete
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Get results from cache
    // @ts-expect-error accessing private field for test
    const result2 = graph.cachedOutputs

    // Upstream cards should NOT be re-evaluated
    expect(p1.evaluateCount).toBe(1)
    expect(p2.evaluateCount).toBe(1)
    expect(p3.evaluateCount).toBe(1)

    // Event card and downstream should be re-evaluated
    expect(eventCard.evaluateCount).toBe(2)
    expect(p4.evaluateCount).toBe(2)
    expect(p5.evaluateCount).toBe(2)
    expect(p6.evaluateCount).toBe(2)

    // Values should reflect the event card using cached upstream value (300) + new internal value (1000)
    // Upstream values unchanged
    expect(result2.get(sourceId)?.[0]).toEqual(dt.value(0))
    expect(result2.get(p1Id)?.[0]).toEqual(dt.value(100))
    expect(result2.get(p2Id)?.[0]).toEqual(dt.value(200))
    expect(result2.get(p3Id)?.[0]).toEqual(dt.value(300))

    // Event card now outputs 300 (cached input from p3) + 1000 (internal) = 1300
    expect(result2.get(eventId)?.[0]).toEqual(dt.value(1300))
    // Downstream continues: 1300+100=1400, 1400+100=1500, 1500+100=1600
    expect(result2.get(p4Id)?.[0]).toEqual(dt.value(1400))
    expect(result2.get(p5Id)?.[0]).toEqual(dt.value(1500))
    expect(result2.get(p6Id)?.[0]).toEqual(dt.value(1600))

    graph.dispose()
})

test("Concurrent events are handled correctly without race conditions", async () => {
    const graph = new ExecutionGraph()

    // Create two parallel event cards that feed into a card that sums their outputs
    const eventA = new EventEmittingTestCard()
    const eventB = new EventEmittingTestCard()
    const passA = new Increment()
    const passB = new Increment()

    const sink = new Sum()

    const eventAId = graph.addNode(eventA, 0, 0)
    const eventBId = graph.addNode(eventB, 0, 0)
    const passAId = graph.addNode(passA, 0, 0)
    const passBId = graph.addNode(passB, 0, 0)
    const sinkId = graph.addNode(sink, 0, 0)

    graph.connect(eventAId, 0, passAId, 0)
    graph.connect(eventBId, 0, passBId, 0)
    graph.connect(passAId, 0, sinkId, 0)
    graph.connect(passBId, 0, sinkId, 1)

    // Initial run: A=0, B=0 -> passA=100, passB=100 -> sink=200
    const output1 = await graph.run()
    expect(output1.get(sinkId)?.[0]).toEqual(dt.value(200))

    // Trigger both events
    // Expected final state A=1, B=1 -> passA=101, passB=101 -> sink=202
    eventA.triggerEvent()
    eventB.triggerEvent()

    await Promise.all([
        graph.runFromNode(eventAId),
        graph.runFromNode(eventBId),
    ])

    // @ts-expect-error The test will reach into the private field. We can ignore error
    const finalSinkValue = graph.cachedOutputs.get(sinkId)?.[0]
    expect(finalSinkValue).toEqual(dt.value(202)) // Both events should be reflected

    graph.dispose()
})

test("Failed card stops execution", async () => {
    const graph = new ExecutionGraph()

    const fail = new FailingCard()
    const increment = new Increment()

    const failId = graph.addNode(fail, 0, 0)
    const passId = graph.addNode(increment, 0, 0)
    graph.connect(failId, 0, passId, 0)

    // Run should fail
    await expect(graph.run()).rejects.toThrow("Fail Card Evaluated")

    // increment should never have been evaluated
    expect(increment.evaluateCount).toBe(0)

    graph.dispose()
})

test("Queue merges rapid events into single run", async () => {
    const graph = new ExecutionGraph()

    const eventCard = new EventEmittingTestCard()
    const slow = new Slow()

    const eventId = graph.addNode(eventCard, 0, 0)
    const slowId = graph.addNode(slow, 0, 0)
    graph.connect(eventId, 0, slowId, 0)

    // Initial run
    await graph.run()
    expect(slow.evaluateCount).toBe(1)

    // Manually trigger event
    eventCard.triggerEvent() // value becomes 1, auto run starts

    // Wait a tick to ensure the run has started
    await new Promise((resolve) => setTimeout(resolve, 1))

    // Now while run is in progress, fire more events
    // Each triggerEvent also auto-calls runFromNode with merge=true
    eventCard.triggerEvent() // 2
    eventCard.triggerEvent() // 3
    eventCard.triggerEvent() // 4

    // Wait for all runs to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Final value should reflect all events
    // @ts-expect-error The test will reach into the private field. We can ignore error
    const finalValue = graph.cachedOutputs.get(eventId)?.[0]
    expect(finalValue).toEqual(dt.value(4))

    // With merging, we should have:
    // 1 initial + 1 first triggered run + 1 merged run = 3 total
    expect(slow.evaluateCount).toBe(3)

    graph.dispose()
})

test("After a failure, removing the node allows future runs", async () => {
    const graph = new ExecutionGraph()

    const fail = new FailingCard()
    const increment = new Increment()

    const failId = graph.addNode(fail, 0, 0)
    const passId = graph.addNode(increment, 0, 0)
    graph.connect(failId, 0, passId, 0)

    await expect(graph.run()).rejects.toThrow("Fail Card Evaluated")

    graph.deleteNode(failId)

    const source = new EventEmittingTestCard()
    const sourceId = graph.addNode(source, 0, 0)
    graph.connect(sourceId, 0, passId, 0)

    const output = await graph.run()
    expect(output.get(passId)?.[0]).toEqual(dt.value(100))
    expect(increment.evaluateCount).toBe(1)

    graph.dispose()
})
