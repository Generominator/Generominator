import { expect, test } from "vitest"
import { dt } from "../../src/cardBase/dataTypes"
import { GateCard } from "../../src/cards/gateCard"
import { ExecutionGraph } from "../../src/execEngine"
import { CountingSinkCard } from "../testingUtils/CountingSinkCard"
import { ConstStateCard } from "../testingUtils/testingCards/constStateCard"
import { ConstValueCard } from "../testingUtils/testingCards/constValueCard"

test("GateCard binds generic type from x and forwards the value", async () => {
    const graph = new ExecutionGraph()
    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const enabledCard = new ConstStateCard()
    enabledCard.state = true
    const enabledNode = graph.addNode(enabledCard, 0, 0)
    const gate = new GateCard()
    const gateNode = graph.addNode(gate, 0, 0)

    graph.connect(valueNode, 0, gateNode, 0)
    graph.connect(enabledNode, 0, gateNode, 1)

    const results = await graph.run()
    expect(gate.inputPort.boundType).toBe("value")
    expect(gate.outputPort.boundType).toBe("value")
    expect(results.get(gateNode)?.[0]).toEqual(dt.value(5))
})

test("GateCard executes downstream only when enabled is true", async () => {
    const graph = new ExecutionGraph()
    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const enabledCard = new ConstStateCard()
    enabledCard.state = false
    const enabledNode = graph.addNode(enabledCard, 0, 0)
    const gateNode = graph.addNode(new GateCard(), 0, 0)
    const sink = new CountingSinkCard()
    const sinkNode = graph.addNode(sink, 0, 0)

    graph.connect(valueNode, 0, gateNode, 0)
    graph.connect(enabledNode, 0, gateNode, 1)
    graph.connect(gateNode, 0, sinkNode, 0)

    const run1 = await graph.run()
    expect(sink.evaluateCount).toBe(0)
    expect(run1.has(sinkNode)).toBe(false)

    enabledCard.state = true
    const run2 = await graph.run()
    expect(sink.evaluateCount).toBe(1)
    expect(run2.has(sinkNode)).toBe(true)
})

test("GateCard clears stale downstream outputs when disabled after being enabled", async () => {
    const graph = new ExecutionGraph()
    const valueNode = graph.addNode(new ConstValueCard(), 0, 0)
    const enabledCard = new ConstStateCard()
    enabledCard.state = true
    const enabledNode = graph.addNode(enabledCard, 0, 0)
    const gateNode = graph.addNode(new GateCard(), 0, 0)
    const sink = new CountingSinkCard()
    const sinkNode = graph.addNode(sink, 0, 0)

    graph.connect(valueNode, 0, gateNode, 0)
    graph.connect(enabledNode, 0, gateNode, 1)
    graph.connect(gateNode, 0, sinkNode, 0)

    const run1 = await graph.run()
    expect(run1.has(sinkNode)).toBe(true)
    expect(sink.evaluateCount).toBe(1)

    enabledCard.state = false
    const run2 = await graph.run()
    expect(run2.has(sinkNode)).toBe(false)
    expect(sink.evaluateCount).toBe(1)
})
